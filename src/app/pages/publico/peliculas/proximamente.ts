import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { GeneroServicio } from '../../../servicios/genero/genero';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';
import { Genero } from '../../../interfaces/genero';
import { TarjetaPelicula } from '../../../componentes/tarjeta-pelicula/tarjeta-pelicula';

@Component({
  imports: [TarjetaPelicula, DatePipe],
  selector: 'app-proximamente',
  styleUrl: './proximamente.css',
  templateUrl: './proximamente.html',
})
export class Proximamente {
  private peliculaServicio = inject(PeliculaServicio);
  private generoServicio = inject(GeneroServicio);
  private funcionServicio = inject(FuncionServicio);
  private errores = inject(Errores);

  private peliculas = signal<Pelicula[]>([]);
  private generosPorPelicula = signal<Map<string, Genero[]>>(new Map());
  private peliculasConFuncion = signal<Set<string>>(new Set());

  protected peliculasProximas = computed(() => {
    const hoy = new Date();

    return this.peliculas()
      .filter((pelicula) => pelicula.activa)
      .filter((pelicula) => pelicula.fecha_estreno && new Date(pelicula.fecha_estreno) > hoy)
      .filter((pelicula) => !this.peliculasConFuncion().has(pelicula.id))
      .sort((a, b) => a.fecha_estreno!.localeCompare(b.fecha_estreno!));
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    const [{ data: peliculas, error }, { data: asignaciones }, { data: funciones }] =
      await Promise.all([
        this.peliculaServicio.listar(),
        this.generoServicio.listarAsignaciones(),
        this.funcionServicio.listarTodasFuturas(),
      ]);

    if (error) {
      this.errores.mostrar(error.message);
      return;
    }

    this.peliculas.set(peliculas ?? []);

    const generosPorPelicula = new Map<string, Genero[]>();
    for (const fila of asignaciones ?? []) {
      const lista = generosPorPelicula.get(fila.pelicula_id) ?? [];
      lista.push(fila.genero);
      generosPorPelicula.set(fila.pelicula_id, lista);
    }
    this.generosPorPelicula.set(generosPorPelicula);

    this.peliculasConFuncion.set(new Set((funciones ?? []).map((f) => f.pelicula_id)));
  }

  protected generosDe(peliculaId: string): Genero[] {
    return this.generosPorPelicula().get(peliculaId) ?? [];
  }
}
