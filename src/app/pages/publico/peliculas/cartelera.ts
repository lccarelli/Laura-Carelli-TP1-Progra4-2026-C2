import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { ConfiguracionHomeServicio } from '../../../servicios/configuracion-home/configuracion-home';
import { GeneroServicio } from '../../../servicios/genero/genero';
import { ResenaServicio } from '../../../servicios/resena/resena';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';
import { Genero } from '../../../interfaces/genero';
import { TarjetaPelicula } from '../../../componentes/tarjeta-pelicula/tarjeta-pelicula';
import { SelectorChips } from '../../../componentes/selector-chips/selector-chips';
import { CarruselDestacadas } from '../../../componentes/carrusel-destacadas/carrusel-destacadas';
import { DestacadaVista } from '../../../componentes/carrusel-destacadas/destacada-vista';
import { estaEnPreventa } from '../../../utilidades/preventa';

const DIAS_CALENDARIO = 14;
const DIAS_VENTANA_ESTRENO = 7;

interface DiaCalendario {
  clave: string;
  nombreDia: string;
  etiquetaFecha: string;
}

function claveDia(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

@Component({
  imports: [TarjetaPelicula, SelectorChips, CarruselDestacadas],
  selector: 'app-cartelera',
  styleUrl: './cartelera.css',
  templateUrl: './cartelera.html',
})
export class Cartelera {
  private peliculaServicio = inject(PeliculaServicio);
  private configuracionHomeServicio = inject(ConfiguracionHomeServicio);
  private generoServicio = inject(GeneroServicio);
  private resenaServicio = inject(ResenaServicio);
  private funcionServicio = inject(FuncionServicio);
  private datePipe = inject(DatePipe);
  private errores = inject(Errores);

  private peliculas = signal<Pelicula[]>([]);
  private generosPorPelicula = signal<Map<string, Genero[]>>(new Map());
  private promedioPorPelicula = signal<Map<string, number>>(new Map());
  private diasConFuncionPorPelicula = signal<Map<string, Set<string>>>(new Map());

  protected destacadas = signal<Pelicula[]>([]);
  protected generos = signal<Genero[]>([]);
  protected generosSeleccionados = signal<Set<string | number>>(new Set());
  protected busqueda = signal('');
  protected diaSeleccionado = signal<string | null>(null);
  protected diasCalendario: DiaCalendario[] = this.construirDiasCalendario();
  private carteleraSeccion = viewChild<ElementRef<HTMLElement>>('carteleraSeccion');

  protected opcionesGenero = computed(() =>
    this.generos().map((genero) => ({ valor: genero.id, etiqueta: genero.nombre })),
  );

  private peliculasActivas = computed(() =>
    this.peliculas().filter((p) => p.activa && this.diasConFuncionPorPelicula().has(p.id)),
  );

  protected peliculasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const seleccionados = this.generosSeleccionados();
    const dia = this.diaSeleccionado();

    return this.peliculasActivas()
      .filter((pelicula) => !texto || pelicula.nombre.toLowerCase().includes(texto))
      .filter((pelicula) => {
        if (seleccionados.size === 0) {
          return true;
        }
        const generos = this.generosPorPelicula().get(pelicula.id) ?? [];
        return generos.some((genero) => seleccionados.has(genero.id));
      })
      .filter((pelicula) => {
        if (!dia) {
          return true;
        }
        return this.diasConFuncionPorPelicula().get(pelicula.id)?.has(dia) ?? false;
      });
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    const [
      { data: peliculas, error },
      { data: asignaciones },
      { data: generos },
      { data: resenas },
      { data: funciones },
    ] = await Promise.all([
      this.peliculaServicio.listar(),
      this.generoServicio.listarAsignaciones(),
      this.generoServicio.listar(),
      this.resenaServicio.listarTodas(),
      this.funcionServicio.listarTodasFuturas(),
    ]);

    if (error) {
      this.errores.mostrar(error.message);
      return;
    }

    this.peliculas.set(peliculas ?? []);
    this.generos.set(generos ?? []);

    const generosPorPelicula = new Map<string, Genero[]>();
    for (const fila of asignaciones ?? []) {
      const lista = generosPorPelicula.get(fila.pelicula_id) ?? [];
      lista.push(fila.genero);
      generosPorPelicula.set(fila.pelicula_id, lista);
    }
    this.generosPorPelicula.set(generosPorPelicula);

    const acumulado = new Map<string, { suma: number; cantidad: number }>();
    for (const resena of resenas ?? []) {
      const actual = acumulado.get(resena.pelicula_id) ?? { suma: 0, cantidad: 0 };
      actual.suma += resena.puntaje;
      actual.cantidad += 1;
      acumulado.set(resena.pelicula_id, actual);
    }
    const promedioPorPelicula = new Map<string, number>();
    for (const [peliculaId, { suma, cantidad }] of acumulado) {
      promedioPorPelicula.set(peliculaId, suma / cantidad);
    }
    this.promedioPorPelicula.set(promedioPorPelicula);

    const diasConFuncionPorPelicula = new Map<string, Set<string>>();
    for (const funcion of funciones ?? []) {
      const dias = diasConFuncionPorPelicula.get(funcion.pelicula_id) ?? new Set<string>();
      dias.add(claveDia(new Date(funcion.inicio)));
      diasConFuncionPorPelicula.set(funcion.pelicula_id, dias);
    }
    this.diasConFuncionPorPelicula.set(diasConFuncionPorPelicula);

    await this.cargarDestacadas();
  }

  async cargarDestacadas() {
    const { data: configuracion } = await this.configuracionHomeServicio.obtener();
    const modo = configuracion?.modo_destacadas ?? 'automatico';

    const { data } =
      modo === 'manual'
        ? await this.peliculaServicio.listarDestacadasManual()
        : await this.peliculaServicio.listarMasVendidasUltimoMes();

    this.destacadas.set(data ?? []);
  }

  alternarGenero(valor: string | number) {
    const seleccionados = new Set(this.generosSeleccionados());

    if (seleccionados.has(valor)) {
      seleccionados.delete(valor);
    } else {
      seleccionados.add(valor);
    }

    this.generosSeleccionados.set(seleccionados);
    this.scrollACartelera();
  }

  actualizarBusqueda(texto: string) {
    this.busqueda.set(texto);
    this.scrollACartelera();
  }

  seleccionarDia(clave: string) {
    this.diaSeleccionado.update((actual) => (actual === clave ? null : clave));
    this.scrollACartelera();
  }

  private scrollACartelera() {
    this.carteleraSeccion()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected promedioDe(peliculaId: string): number | null {
    const promedio = this.promedioPorPelicula().get(peliculaId);
    return promedio !== undefined ? Math.round(promedio) : null;
  }

  protected generosDe(peliculaId: string): Genero[] {
    return this.generosPorPelicula().get(peliculaId) ?? [];
  }

  protected destacadasVista = computed<DestacadaVista[]>(() =>
    this.destacadas().map((pelicula) => ({
      pelicula,
      promedio: this.promedioDe(pelicula.id),
      esEstreno: this.esEstreno(pelicula),
      generos: this.generosDe(pelicula.id),
    })),
  );

  protected esEstreno(pelicula: Pelicula): boolean {
    if (!pelicula.fecha_estreno) {
      return false;
    }

    const estreno = new Date(`${pelicula.fecha_estreno}T00:00:00`);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const limite = new Date(estreno);
    limite.setDate(limite.getDate() + DIAS_VENTANA_ESTRENO);

    return hoy >= estreno && hoy < limite;
  }

  protected esPreventa(pelicula: Pelicula): boolean {
    return estaEnPreventa(pelicula);
  }

  private construirDiasCalendario(): DiaCalendario[] {
    const dias: DiaCalendario[] = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 0; i < DIAS_CALENDARIO; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);

      dias.push({
        clave: claveDia(fecha),
        nombreDia: i === 0 ? 'Hoy' : (this.datePipe.transform(fecha, 'EEEE') ?? ''),
        etiquetaFecha: this.datePipe.transform(fecha, 'dd/MM') ?? '',
      });
    }

    return dias;
  }
}
