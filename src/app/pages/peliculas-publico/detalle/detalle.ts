import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { GeneroServicio } from '../../../servicios/genero/genero';
import { ResenaServicio } from '../../../servicios/resena/resena';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';
import { Genero } from '../../../interfaces/genero';
import { Resena } from '../../../interfaces/resena';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { EstrellasPipe } from '../../../pipes/estrellas/estrellas';
import { RestriccionEdadPipe } from '../../../pipes/restriccion-edad/restriccion-edad';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

const PUNTAJES = [1, 2, 3, 4, 5];

@Component({
  imports: [Boton, BotonLink, DatePipe, DecimalPipe, EstrellasPipe, RestriccionEdadPipe],
  selector: 'app-detalle-pelicula',
  styleUrl: './detalle.css',
  templateUrl: './detalle.html',
})
export class DetallePelicula {
  private route = inject(ActivatedRoute);
  private peliculaServicio = inject(PeliculaServicio);
  private generoServicio = inject(GeneroServicio);
  private resenaServicio = inject(ResenaServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);
  protected auth = inject(Auth);

  protected puntajes = PUNTAJES;

  protected pelicula = signal<Pelicula | null>(null);
  protected generos = signal<Genero[]>([]);
  protected resenas = signal<Resena[]>([]);
  protected yaReseno = signal(false);
  protected puntajeSeleccionado = signal(0);
  protected texto = signal('');

  protected promedio = computed(() => {
    const resenas = this.resenas();

    if (resenas.length === 0) {
      return null;
    }

    return resenas.reduce((acumulado, r) => acumulado + r.puntaje, 0) / resenas.length;
  });

  protected promedioRedondeado = computed(() => Math.round(this.promedio() ?? 0));

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargar(id);
    }
  }

  async cargar(id: string) {
    const [{ data, error }, { data: generos }, { data: resenas }] = await Promise.all([
      this.peliculaServicio.buscarPorId(id),
      this.generoServicio.listarPorPelicula(id),
      this.resenaServicio.listarPorPelicula(id),
    ]);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró la película');
      return;
    }

    this.pelicula.set(data);
    this.generos.set(generos ?? []);
    this.resenas.set(resenas ?? []);

    const usuarioId = this.auth.usuario()?.id;

    if (usuarioId) {
      const { data: propia } = await this.resenaServicio.buscarDeUsuario(id, usuarioId);
      this.yaReseno.set(!!propia);
    }
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
}
