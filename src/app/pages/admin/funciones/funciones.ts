import { Component, computed, inject, signal } from '@angular/core';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../servicios/sala/sala';
import { Errores } from '../../../servicios/errores/errores';
import { Funcion } from '../../../interfaces/funcion';
import { Pelicula } from '../../../interfaces/pelicula';
import { Sala } from '../../../interfaces/sala';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { EstadoPunto } from '../../../componentes/estado-punto/estado-punto';
import { DatePipe, UpperCasePipe } from '@angular/common';

@Component({
  imports: [BotonLink, EstadoPunto, DatePipe, UpperCasePipe],
  selector: 'app-funciones',
  styleUrl: './funciones.css',
  templateUrl: './funciones.html',
})
export class Funciones {
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private salaServicio = inject(SalaServicio);
  private errores = inject(Errores);

  private funciones = signal<Funcion[]>([]);
  private peliculas = signal<Pelicula[]>([]);
  private salas = signal<Sala[]>([]);

  protected filas = computed(() =>
    this.funciones().map((funcion) => ({
      id: funcion.id,
      activa: funcion.activa,
      pelicula: this.peliculas().find((p) => p.id === funcion.pelicula_id)?.nombre ?? '—',
      sala: this.salas().find((s) => s.id === funcion.sala_id)?.nombre ?? '—',
      inicio: funcion.inicio,
      fin: funcion.fin,
      formato: funcion.formato,
      idioma: funcion.idioma,
    })),
  );

  constructor() {
    this.cargar();
  }

  async cargar() {
    const [{ data: funciones, error: errorFunciones }, { data: peliculas }, { data: salas }] =
      await Promise.all([
        this.funcionServicio.listar(),
        this.peliculaServicio.listar(),
        this.salaServicio.listar(),
      ]);

    if (errorFunciones) {
      this.errores.mostrar(errorFunciones.message);
      return;
    }

    this.funciones.set(funciones ?? []);
    this.peliculas.set(peliculas ?? []);
    this.salas.set(salas ?? []);
  }
}
