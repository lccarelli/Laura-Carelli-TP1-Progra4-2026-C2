import { Component, computed, inject, signal } from '@angular/core';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

@Component({
  imports: [Boton, BotonLink],
  selector: 'app-peliculas',
  styleUrl: './peliculas.css',
  templateUrl: './peliculas.html',
})
export class Peliculas {
  private peliculaServicio = inject(PeliculaServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

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
    const { data, error } = await this.peliculaServicio.listar();

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
    const { error } = await this.peliculaServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaPelicula, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaPelicula, TipoEvento.Exito, id);
      await this.cargar();
    }
  }
}
