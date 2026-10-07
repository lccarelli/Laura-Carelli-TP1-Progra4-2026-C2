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
import { Cargando } from '../../../../componentes/cargando/cargando';
import { Boton } from '../../../../componentes/boton/boton';
import { ConfirmarAccion } from '../../../../componentes/confirmar-accion/confirmar-accion';
import { BotonLink } from '../../../../componentes/boton-link/boton-link';
import { EstadoPunto } from '../../../../componentes/estado-punto/estado-punto';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';
import { avisoDeConservadas, descripcionDeBaja } from '../../../../utilidades/baja-funciones';
import { Seleccion } from '../../../../utilidades/seleccion';

@Component({
  imports: [Boton, BotonLink, Cargando, ConfirmarAccion, EstadoPunto, DatePipe, UpperCasePipe],
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
  private logger = inject(Logger);

  protected pelicula = signal<Pelicula | null>(null);
  protected seleccion = new Seleccion();
  protected confirmando = signal(false);
  protected eliminando = signal(false);
  private funciones = signal<Funcion[]>([]);
  private salas = signal<Sala[]>([]);
  private peliculaId = '';

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

  protected idsVisibles = computed(() => this.filas().map((fila) => fila.id));

  constructor() {
    const peliculaId = this.route.snapshot.paramMap.get('peliculaId');

    if (peliculaId) {
      this.peliculaId = peliculaId;
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

  pedirEliminar() {
    this.confirmando.set(true);
  }

  cancelarEliminar() {
    this.confirmando.set(false);
  }

  async eliminarSeleccionadas() {
    if (this.eliminando() || this.seleccion.cantidad() === 0) {
      return;
    }

    this.eliminando.set(true);

    try {
      const { eliminadas, conservadas, error } = await this.funcionServicio.eliminarVarias(
        this.seleccion.ids(),
      );

      if (error) {
        this.logger.registrar(Flujo.BajaFuncion, TipoEvento.Error, error.message);
        this.errores.mostrar(error.message);
        return;
      }

      this.logger.registrar(
        Flujo.BajaFuncion,
        TipoEvento.Exito,
        `${this.pelicula()?.nombre}: ${descripcionDeBaja(eliminadas)}`,
      );

      const aviso = avisoDeConservadas(conservadas);
      if (aviso) {
        this.errores.mostrar(aviso);
      }

      this.confirmando.set(false);
      this.seleccion.limpiar();
      await this.cargar(this.peliculaId);
    } finally {
      this.eliminando.set(false);
    }
  }
}
