import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { GeneroServicio } from '../../../servicios/genero/genero';
import { ResenaServicio } from '../../../servicios/resena/resena';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { SalaServicio } from '../../../servicios/sala/sala';
import { Auth } from '../../../servicios/auth/auth';
import { PushServicio } from '../../../servicios/push/push';
import { AlertaDisponibilidadServicio } from '../../../servicios/alerta-disponibilidad/alerta-disponibilidad';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';
import { Genero } from '../../../interfaces/genero';
import { Resena } from '../../../interfaces/resena';
import { Funcion } from '../../../interfaces/funcion';
import { Sala } from '../../../interfaces/sala';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Poster } from '../../../componentes/poster/poster';
import { Cargando } from '../../../componentes/cargando/cargando';
import { EstrellasPipe } from '../../../pipes/estrellas/estrellas';
import { RestriccionEdadPipe } from '../../../pipes/restriccion-edad/restriccion-edad';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { extraerIdYoutube, urlEmbedYoutube } from '../../../utilidades/youtube';

const PUNTAJES = [1, 2, 3, 4, 5];
const DIAS_CALENDARIO = 14;

export interface FuncionConSala {
  funcion: Funcion;
  sala: string;
}

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
  imports: [Boton, BotonLink, Poster, Cargando, DatePipe, EstrellasPipe, RestriccionEdadPipe],
  selector: 'app-detalle-pelicula',
  styleUrl: './detalle.css',
  templateUrl: './detalle.html',
})
export class Detalle {
  private route = inject(ActivatedRoute);
  protected router = inject(Router);
  private peliculaServicio = inject(PeliculaServicio);
  private generoServicio = inject(GeneroServicio);
  private resenaServicio = inject(ResenaServicio);
  private funcionServicio = inject(FuncionServicio);
  private salaServicio = inject(SalaServicio);
  private pushServicio = inject(PushServicio);
  private alertaDisponibilidadServicio = inject(AlertaDisponibilidadServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);
  private datePipe = inject(DatePipe);
  private sanitizer = inject(DomSanitizer);
  protected auth = inject(Auth);

  protected puntajes = PUNTAJES;

  protected pelicula = signal<Pelicula | null>(null);
  protected generos = signal<Genero[]>([]);
  protected resenas = signal<Resena[]>([]);
  protected funciones = signal<FuncionConSala[]>([]);
  protected yaReseno = signal(false);
  protected puntajeSeleccionado = signal(0);
  protected texto = signal('');
  protected diaSeleccionado = signal<string | null>(null);
  protected alertaActiva = signal(false);
  protected activandoAlerta = signal(false);

  protected esProximamente = computed(() => {
    const pelicula = this.pelicula();

    if (!pelicula?.fecha_estreno) {
      return false;
    }

    return (
      pelicula.avisar_notificaciones &&
      new Date(pelicula.fecha_estreno) > new Date() &&
      this.funciones().length === 0
    );
  });

  protected funcionesPorDia = computed(() => {
    const mapa = new Map<string, FuncionConSala[]>();

    for (const item of this.funciones()) {
      const clave = claveDia(new Date(item.funcion.inicio));
      const lista = mapa.get(clave) ?? [];
      lista.push(item);
      mapa.set(clave, lista);
    }

    for (const lista of mapa.values()) {
      lista.sort((a, b) => a.funcion.inicio.localeCompare(b.funcion.inicio));
    }

    return mapa;
  });

  protected diasCalendario = computed<DiaCalendario[]>(() => {
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
  });

  protected horariosDelDia = computed(() => {
    const dia = this.diaSeleccionado();
    return dia ? (this.funcionesPorDia().get(dia) ?? []) : [];
  });

  protected promedio = computed(() => {
    const resenas = this.resenas();

    if (resenas.length === 0) {
      return null;
    }

    return resenas.reduce((acumulado, r) => acumulado + r.puntaje, 0) / resenas.length;
  });

  protected promedioRedondeado = computed(() => Math.round(this.promedio() ?? 0));
  protected trailerCargado = signal(false);

  protected trailerEmbebido = computed<SafeResourceUrl | null>(() => {
    const trailerUrl = this.pelicula()?.trailer_url;

    if (!trailerUrl) {
      return null;
    }

    const idYoutube = extraerIdYoutube(trailerUrl);

    if (!idYoutube) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(urlEmbedYoutube(idYoutube));
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargar(id);
    }
  }

  async cargar(id: string) {
    const [
      { data, error },
      { data: generos },
      { data: resenas },
      { data: funciones },
      { data: salas },
    ] = await Promise.all([
      this.peliculaServicio.buscarPorId(id),
      this.generoServicio.listarPorPelicula(id),
      this.resenaServicio.listarPorPelicula(id),
      this.funcionServicio.listarFuturasDePelicula(id),
      this.salaServicio.listar(),
    ]);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró la película');
      return;
    }

    this.pelicula.set(data);
    this.trailerCargado.set(false);
    this.generos.set(generos ?? []);
    this.resenas.set(resenas ?? []);
    this.funciones.set(this.combinarConSala(funciones ?? [], salas ?? []));

    const usuarioId = this.auth.usuario()?.id;

    if (usuarioId) {
      const { data: propia } = await this.resenaServicio.buscarDeUsuario(id, usuarioId);
      this.yaReseno.set(!!propia);

      const { data: alerta } = await this.alertaDisponibilidadServicio.buscar(id);
      this.alertaActiva.set(!!alerta);
    }
  }

  private combinarConSala(funciones: Funcion[], salas: Sala[]): FuncionConSala[] {
    return funciones.map((funcion) => ({
      funcion,
      sala: salas.find((s) => s.id === funcion.sala_id)?.nombre ?? '—',
    }));
  }

  trailerCargo() {
    this.trailerCargado.set(true);
  }

  elegirDia(clave: string) {
    if (!this.funcionesPorDia().has(clave)) {
      return;
    }

    this.diaSeleccionado.update((actual) => (actual === clave ? null : clave));
  }

  async elegirFuncion(id: string) {
    await this.router.navigate(['/funciones', id]);
  }

  elegirPuntaje(puntaje: number) {
    this.puntajeSeleccionado.set(puntaje);
  }

  escribirTexto(texto: string) {
    this.texto.set(texto);
  }

  async enviarResena() {
    const pelicula = this.pelicula();
    const usuarioId = this.auth.usuario()?.id;
    const puntaje = this.puntajeSeleccionado();

    if (!pelicula || !usuarioId || puntaje === 0) {
      return;
    }

    const { error } = await this.resenaServicio.crear({
      pelicula_id: pelicula.id,
      usuario_id: usuarioId,
      puntaje,
      texto: this.texto().trim() || null,
    });

    if (error) {
      this.logger.registrar(Flujo.AltaResena, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.AltaResena, TipoEvento.Exito, `${pelicula.nombre}: ${puntaje}`);
    this.puntajeSeleccionado.set(0);
    this.texto.set('');
    await this.cargar(pelicula.id);
  }

  async alternarAlerta() {
    const pelicula = this.pelicula();

    if (!pelicula || this.activandoAlerta()) {
      return;
    }

    this.activandoAlerta.set(true);

    if (this.alertaActiva()) {
      const { error } = await this.alertaDisponibilidadServicio.desactivar(pelicula.id);
      this.activandoAlerta.set(false);

      if (error) {
        this.errores.mostrar(error.message);
        return;
      }

      this.alertaActiva.set(false);
      this.logger.registrar(
        Flujo.AlertaDisponibilidad,
        TipoEvento.Exito,
        `cancelada: ${pelicula.nombre}`,
      );
      return;
    }

    const { error: errorPush } = await this.pushServicio.suscribir();

    if (errorPush) {
      this.activandoAlerta.set(false);
      this.logger.registrar(Flujo.AlertaDisponibilidad, TipoEvento.Error, errorPush.message);
      this.errores.mostrar(errorPush.message);
      return;
    }

    const { error } = await this.alertaDisponibilidadServicio.activar(pelicula.id);
    this.activandoAlerta.set(false);

    if (error) {
      this.logger.registrar(Flujo.AlertaDisponibilidad, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.alertaActiva.set(true);
    this.logger.registrar(Flujo.AlertaDisponibilidad, TipoEvento.Exito, pelicula.nombre);
  }
}
