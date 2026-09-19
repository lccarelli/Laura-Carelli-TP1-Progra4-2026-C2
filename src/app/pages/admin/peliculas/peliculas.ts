import { Component, computed, inject, signal } from '@angular/core';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';

@Component({
  imports: [Boton, BotonLink],
  selector: 'app-peliculas',
  styleUrl: './peliculas.css',
  templateUrl: './peliculas.html',
})
export class Peliculas {
  private pelicula = inject(PeliculaServicio);
  private errores = inject(Errores);

  protected peliculas = signal<Pelicula[]>([]);
  protected busqueda = signal('');

  protected peliculasFiltradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();

    if (!texto) {
      return this.peliculas();
    }

    return this.peliculas().filter((pelicula) => pelicula.nombre.toLowerCase().includes(texto));
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.pelicula.listar();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.peliculas.set(data ?? []);
    }
  }

  buscar(texto: string) {
    this.busqueda.set(texto);
  }

  async eliminar(id: string) {
    const { error } = await this.pelicula.eliminar(id);

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      await this.cargar();
    }
  }
}
