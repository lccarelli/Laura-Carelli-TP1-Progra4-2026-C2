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

export interface ResultadoBaja {
  eliminadas: number;
  conservadas: number;
  error?: { message: string };
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

  listarPorPelicula(peliculaId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('inicio', { ascending: false })
      .returns<Funcion[]>();
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

  listarTodasFuturas() {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
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

  async eliminarDePelicula(peliculaId: string): Promise<ResultadoBaja> {
    const { data, error } = await this.supabase.Supabase.rpc('eliminar_funciones_de_pelicula', {
      pelicula_id_param: peliculaId,
    });

    return this.resultadoDeBaja(data, error);
  }

  async eliminarVarias(ids: string[]): Promise<ResultadoBaja> {
    if (ids.length === 0) {
      return { eliminadas: 0, conservadas: 0 };
    }

    const { data, error } = await this.supabase.Supabase.rpc('eliminar_funciones', {
      funcion_ids: ids,
    });

    return this.resultadoDeBaja(data, error);
  }

  private resultadoDeBaja(
    data: { eliminadas: number; conservadas: number } | null,
    error: { message: string } | null,
  ): ResultadoBaja {
    if (error || !data) {
      return {
        eliminadas: 0,
        conservadas: 0,
        error: error ?? { message: 'No se pudieron eliminar las funciones.' },
      };
    }

    return { eliminadas: data.eliminadas, conservadas: data.conservadas };
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

    const teniaFuncionesFuturas = this.tieneFuncionesFuturas(datos.pelicula_id, contexto.funciones);

    const resultado = await this.crearOcurrencia(
      datos,
      pelicula,
      contexto.salas,
      contexto.funciones,
      contexto.peliculas,
    );

    if (resultado.creada && !teniaFuncionesFuturas) {
      await this.avisarDisponibilidad(pelicula);
    }

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

    const teniaFuncionesFuturas = this.tieneFuncionesFuturas(datos.pelicula_id, contexto.funciones);

    const [horas, minutos] = datos.hora.split(':').map(Number);
    const resultados: ResultadoOcurrencia[] = [];
    let seCreoAlguna = false;

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
        precios: datos.precios,
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
        seCreoAlguna = true;
      }
    }

    if (seCreoAlguna && !teniaFuncionesFuturas) {
      await this.avisarDisponibilidad(pelicula);
    }

    return { resultados };
  }

  private tieneFuncionesFuturas(peliculaId: string, funciones: Funcion[]): boolean {
    const ahora = Date.now();
    return funciones.some(
      (funcion) => funcion.pelicula_id === peliculaId && new Date(funcion.inicio).getTime() > ahora,
    );
  }

  private async avisarDisponibilidad(pelicula: Pelicula) {
    if (!pelicula.avisar_notificaciones) {
      return;
    }

    try {
      await this.supabase.Supabase.functions.invoke('enviar-alertas-disponibilidad', {
        body: { peliculaId: pelicula.id, peliculaNombre: pelicula.nombre },
      });
    } catch {
      // best-effort: si falla el aviso push no queremos romper el alta de la función
    }
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
            precio_normal: datos.precios.normal,
            precio_accesible: datos.precios.accesible,
            precio_vip: datos.precios.vip,
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
