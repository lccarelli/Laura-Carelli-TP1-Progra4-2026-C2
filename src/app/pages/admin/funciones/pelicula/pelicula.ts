import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FuncionServicio } from '../../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../../servicios/sala/sala';
import { Errores } from '../../../../servicios/errores/errores';
import { Funcion } from '../../../../interfaces/funcion';
import { Pelicula } from '../../../../interfaces/pelicula';
import { Sala } from '../../../../interfaces/sala';
import { BotonLink } from '../../../../componentes/boton-link/boton-link';
import { EstadoPunto } from '../../../../componentes/estado-punto/estado-punto';

@Component({
  imports: [BotonLink, EstadoPunto, DatePipe, UpperCasePipe],
  selector: 'app-funciones-pelicula',
  styleUrl: './pelicula.css',
  templateUrl: './pelicula.html',
})
export class FuncionesPelicula {
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private salaServicio = inject(SalaServicio);
  private errores = inject(Errores);
  private route = inject(ActivatedRoute);

  protected pelicula = signal<Pelicula | null>(null);
  private funciones = signal<Funcion[]>([]);
  private salas = signal<Sala[]>([]);

  protected filas = computed(() =>
    this.funciones().map((funcion) => ({
      id: funcion.id,
      activa: funcion.activa,
      sala: this.salas().find((s) => s.id === funcion.sala_id)?.nombre ?? '—',
      inicio: funcion.inicio,
      fin: funcion.fin,
      formato: funcion.formato,
      idioma: funcion.idioma,
    })),
  );

  constructor() {
    const peliculaId = this.route.snapshot.paramMap.get('peliculaId');

    if (peliculaId) {
      this.cargar(peliculaId);
    }
  }

  async cargar(peliculaId: string) {
    const [
      { data: pelicula, error: errorPelicula },
      { data: funciones, error: errorFunciones },
      { data: salas },
    ] = await Promise.all([
      this.peliculaServicio.buscarPorId(peliculaId),
      this.funcionServicio.listarPorPelicula(peliculaId),
      this.salaServicio.listar(),
    ]);

    if (errorPelicula || !pelicula) {
      this.errores.mostrar(errorPelicula?.message ?? 'No se encontró la película');
      return;
    }

    if (errorFunciones) {
      this.errores.mostrar(errorFunciones.message);
      return;
    }

    this.pelicula.set(pelicula);
    this.funciones.set(funciones ?? []);
    this.salas.set(salas ?? []);
  }
}
