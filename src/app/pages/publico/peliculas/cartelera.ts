import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';

@Component({
  imports: [RouterLink],
  selector: 'app-cartelera',
  styleUrl: './cartelera.css',
  templateUrl: './cartelera.html',
})
export class Cartelera {
  private peliculaServicio = inject(PeliculaServicio);
  private errores = inject(Errores);

  private peliculas = signal<Pelicula[]>([]);

  protected peliculasActivas = computed(() => this.peliculas().filter((p) => p.activa));

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.peliculaServicio.listar();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.peliculas.set(data ?? []);
    }
  }
}
