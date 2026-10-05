import { Component, computed, inject, signal } from '@angular/core';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { GeneroServicio } from '../../../servicios/genero/genero';
import { Errores } from '../../../servicios/errores/errores';
import { Pelicula } from '../../../interfaces/pelicula';
import { Genero } from '../../../interfaces/genero';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { EstadoPunto } from '../../../componentes/estado-punto/estado-punto';
import { HaceTiempoPipe } from '../../../pipes/hace-tiempo/hace-tiempo';
import { RestriccionEdadPipe } from '../../../pipes/restriccion-edad/restriccion-edad';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

@Component({
  imports: [Boton, BotonLink, EstadoPunto, HaceTiempoPipe, RestriccionEdadPipe],
  selector: 'app-peliculas',
  styleUrl: './peliculas.css',
  templateUrl: './peliculas.html',
})
export class Peliculas {
  private peliculaServicio = inject(PeliculaServicio);
  private generoServicio = inject(GeneroServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected peliculas = signal<Pelicula[]>([]);
  protected busqueda = signal('');
  protected generosPorPelicula = signal<Map<string, Genero[]>>(new Map());

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
    const [{ data, error }, { data: asignaciones }] = await Promise.all([
      this.peliculaServicio.listar(),
      this.generoServicio.listarAsignaciones(),
    ]);

    if (error) {
      this.errores.mostrar(error.message);
      return;
    }

    this.peliculas.set(data ?? []);

    const generosPorPelicula = new Map<string, Genero[]>();

    for (const asignacion of asignaciones ?? []) {
      const generos = generosPorPelicula.get(asignacion.pelicula_id) ?? [];
      generos.push(asignacion.genero);
      generosPorPelicula.set(asignacion.pelicula_id, generos);
    }

    this.generosPorPelicula.set(generosPorPelicula);
  }

  generosDe(peliculaId: string): Genero[] {
    return this.generosPorPelicula().get(peliculaId) ?? [];
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
