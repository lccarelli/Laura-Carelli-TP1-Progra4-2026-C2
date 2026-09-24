import { inject, Service } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Supabase } from '../supabase/supabase';
import { PeliculaServicio } from '../pelicula/pelicula';
import { SalaServicio } from '../sala/sala';
import { Funcion } from '../../interfaces/funcion';
import { FuncionPorCrear } from '../../interfaces/funcion-por-crear';
import { FuncionRecurrentePorCrear } from '../../interfaces/funcion-recurrente-por-crear';
import { Pelicula } from '../../interfaces/pelicula';
import { Sala } from '../../interfaces/sala';

const MARGEN_MS = 30 * 60_000;

function seSuperponen(aInicio: number, aFin: number, bInicio: number, bFin: number): boolean {
  return aInicio < bFin + MARGEN_MS && bInicio < aFin + MARGEN_MS;
}

function fechasEntre(desde: string, hasta: string): Date[] {
  const fechas: Date[] = [];
  const actual = new Date(`${desde}T00:00:00`);
  const limite = new Date(`${hasta}T00:00:00`);

  while (actual <= limite) {
    fechas.push(new Date(actual));
    actual.setDate(actual.getDate() + 1);
  }

  return fechas;
}

export interface ResultadoOcurrencia {
  fecha: Date;
  sala?: string;
  error?: string;
}

@Service()
export class FuncionServicio {
  private supabase = inject(Supabase);
  private peliculaServicio = inject(PeliculaServicio);
  private salaServicio = inject(SalaServicio);
  private datePipe = inject(DatePipe);
  private readonly tabla = 'funcion';

  listar() {
    return this.supabase.listar<Funcion>(this.tabla);
  }

  buscarPorId(id: string) {
    return this.supabase.obtenerPorId<Funcion>(this.tabla, id);
  }

  listarFuturasDePelicula(peliculaId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('pelicula_id', peliculaId)
      .eq('activa', true)
      .gte('inicio', new Date().toISOString())
      .order('inicio')
      .returns<Funcion[]>();
  }

  cambiarEstado(id: string, activa: boolean) {
    return this.supabase.actualizar<Funcion>(this.tabla, id, { activa });
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }

  async crear(datos: FuncionPorCrear) {
    const { data: pelicula, error: errorPelicula } = await this.peliculaServicio.buscarPorId(
      datos.pelicula_id,
    );

    if (errorPelicula || !pelicula) {
      return { error: errorPelicula ?? { message: 'No se encontró la película' } };
    }

    const contexto = await this.cargarContexto();

    if (contexto.error) {
      return { error: contexto.error };
    }

    const resultado = await this.crearOcurrencia(
      datos,
      pelicula,
      contexto.salas,
      contexto.funciones,
      contexto.peliculas,
    );

    return { error: resultado.error ? { message: resultado.error } : undefined };
  }

  async crearRecurrente(datos: FuncionRecurrentePorCrear): Promise<{
    error?: { message: string };
    resultados?: ResultadoOcurrencia[];
  }> {
    const { data: pelicula, error: errorPelicula } = await this.peliculaServicio.buscarPorId(
      datos.pelicula_id,
    );

    if (errorPelicula || !pelicula) {
      return { error: errorPelicula ?? { message: 'No se encontró la película' } };
    }

    const contexto = await this.cargarContexto();

    if (contexto.error) {
      return { error: contexto.error };
    }

    const [horas, minutos] = datos.hora.split(':').map(Number);
    const resultados: ResultadoOcurrencia[] = [];

    for (const fecha of fechasEntre(datos.desde, datos.hasta)) {
      if (!datos.dias.includes(fecha.getDay())) {
        continue;
      }

      const inicio = new Date(fecha);
      inicio.setHours(horas, minutos, 0, 0);

      const ocurrencia: FuncionPorCrear = {
        pelicula_id: datos.pelicula_id,
        inicio: inicio.toISOString(),
        formato: datos.formato,
        idioma: datos.idioma,
      };

      const resultado = await this.crearOcurrencia(
        ocurrencia,
        pelicula,
        contexto.salas,
        contexto.funciones,
        contexto.peliculas,
      );

      resultados.push({
        fecha: inicio,
        sala: resultado.sala,
        error: resultado.error,
      });

      if (resultado.creada) {
        contexto.funciones.push(resultado.creada);
      }
    }

    return { resultados };
  }

  private async cargarContexto() {
    const [{ data: salas, error: errorSalas }, { data: funciones, error: errorFunciones }] =
      await Promise.all([this.salaServicio.listar(), this.listar()]);

    if (errorSalas || !salas) {
      return { error: errorSalas, salas: [], funciones: [], peliculas: [] };
    }

    if (errorFunciones || !funciones) {
      return { error: errorFunciones, salas: [], funciones: [], peliculas: [] };
    }

    const { data: peliculas, error: errorPeliculas } = await this.peliculaServicio.listar();

    if (errorPeliculas || !peliculas) {
      return { error: errorPeliculas, salas: [], funciones: [], peliculas: [] };
    }

    return { error: undefined, salas, funciones, peliculas };
  }

  private async crearOcurrencia(
    datos: FuncionPorCrear,
    pelicula: Pelicula,
    salas: Sala[],
    funciones: Funcion[],
    peliculas: Pelicula[],
  ): Promise<{ sala?: string; error?: string; creada?: Funcion }> {
    const inicio = new Date(datos.inicio);
    const fin = new Date(inicio.getTime() + pelicula.duracion_minutos * 60_000);

    const ocupadas: string[] = [];

    for (const sala of salas) {
      const conflicto = funciones.find(
        (funcion) =>
          funcion.sala_id === sala.id &&
          seSuperponen(
            inicio.getTime(),
            fin.getTime(),
            new Date(funcion.inicio).getTime(),
            new Date(funcion.fin).getTime(),
          ),
      );

      if (!conflicto) {
        const { data, error } = await this.supabase.Supabase.from(this.tabla)
          .insert({
            pelicula_id: datos.pelicula_id,
            sala_id: sala.id,
            inicio: inicio.toISOString(),
            fin: fin.toISOString(),
            formato: datos.formato,
            idioma: datos.idioma,
          })
          .select()
          .returns<Funcion[]>();

        if (error || !data) {
          return { error: error?.message ?? 'No se pudo crear la función' };
        }

        return { sala: sala.nombre, creada: data[0] };
      }

      const peliculaConflicto = peliculas.find((p) => p.id === conflicto.pelicula_id);
      const desde = this.datePipe.transform(conflicto.inicio, 'HH:mm');
      const hasta = this.datePipe.transform(conflicto.fin, 'HH:mm');
      ocupadas.push(
        `${sala.nombre}: ocupada por "${peliculaConflicto?.nombre ?? 'otra función'}" de ${desde} a ${hasta}`,
      );
    }

    return { error: `No hay ninguna sala libre para ese horario. ${ocupadas.join(' — ')}` };
  }
}
