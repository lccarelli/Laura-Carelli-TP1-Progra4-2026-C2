import { Component, computed, inject, signal } from '@angular/core';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { Errores } from '../../../servicios/errores/errores';
import { Funcion } from '../../../interfaces/funcion';
import { Pelicula } from '../../../interfaces/pelicula';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { EstadoPunto } from '../../../componentes/estado-punto/estado-punto';

interface FilaPelicula {
  peliculaId: string;
  nombre: string;
  cantidad: number;
  algunaActiva: boolean;
}

@Component({
  imports: [BotonLink, EstadoPunto],
  selector: 'app-funciones',
  styleUrl: './funciones.css',
  templateUrl: './funciones.html',
})
export class Funciones {
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private errores = inject(Errores);

  private funciones = signal<Funcion[]>([]);
  private peliculas = signal<Pelicula[]>([]);
  protected busqueda = signal('');

  private filasPelicula = computed<FilaPelicula[]>(() => {
    const porPelicula = new Map<string, Funcion[]>();

    for (const funcion of this.funciones()) {
      const lista = porPelicula.get(funcion.pelicula_id) ?? [];
      lista.push(funcion);
      porPelicula.set(funcion.pelicula_id, lista);
    }

    return [...porPelicula.entries()]
      .map(([peliculaId, funciones]) => ({
        peliculaId,
        nombre: this.peliculas().find((p) => p.id === peliculaId)?.nombre ?? '—',
        cantidad: funciones.length,
        algunaActiva: funciones.some((funcion) => funcion.activa),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  protected filasFiltradas = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();

    if (!texto) {
      return this.filasPelicula();
    }

    return this.filasPelicula().filter((fila) => fila.nombre.toLowerCase().includes(texto));
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    const [{ data: funciones, error: errorFunciones }, { data: peliculas }] = await Promise.all([
      this.funcionServicio.listar(),
      this.peliculaServicio.listar(),
    ]);

    if (errorFunciones) {
      this.errores.mostrar(errorFunciones.message);
      return;
    }

    this.funciones.set(funciones ?? []);
    this.peliculas.set(peliculas ?? []);
  }

  buscar(texto: string) {
    this.busqueda.set(texto);
  }
}
