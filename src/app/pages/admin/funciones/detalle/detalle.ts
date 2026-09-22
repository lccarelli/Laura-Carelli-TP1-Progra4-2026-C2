import { Component, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FuncionServicio } from '../../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../../servicios/sala/sala';
import { EntradaServicio } from '../../../../servicios/entrada/entrada';
import { Errores } from '../../../../servicios/errores/errores';
import { Funcion } from '../../../../interfaces/funcion';
import { Pelicula } from '../../../../interfaces/pelicula';
import { Butaca } from '../../../../interfaces/butaca';
import { Entrada } from '../../../../interfaces/entrada';
import { Boton } from '../../../../componentes/boton/boton';
import { BotonLink } from '../../../../componentes/boton-link/boton-link';
import { EstadoPunto } from '../../../../componentes/estado-punto/estado-punto';
import { MapaButacas } from '../../../../componentes/mapa-butacas/mapa-butacas';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

const TABLA_NO_ENCONTRADA = 'PGRST205';

@Component({
  imports: [Boton, BotonLink, EstadoPunto, MapaButacas, DatePipe, UpperCasePipe],
  selector: 'app-detalle',
  styleUrl: './detalle.css',
  templateUrl: './detalle.html',
})
export class Detalle {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private salaServicio = inject(SalaServicio);
  private entradaServicio = inject(EntradaServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected funcion = signal<Funcion | null>(null);
  protected pelicula = signal<Pelicula | null>(null);
  protected sala = signal<string>('—');
  protected butacas = signal<Butaca[]>([]);
  protected entradas = signal<Entrada[]>([]);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargar(id);
    }
  }

  async cargar(id: string) {
    const { data, error } = await this.funcionServicio.buscarPorId(id);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró la función');
      return;
    }

    this.funcion.set(data);

    const [{ data: pelicula }, { data: salas }, { data: butacas, error: errorButacas }] =
      await Promise.all([
        this.peliculaServicio.buscarPorId(data.pelicula_id),
        this.salaServicio.listar(),
        this.salaServicio.listarButacas(data.sala_id),
      ]);

    this.pelicula.set(pelicula ?? null);
    this.sala.set(salas?.find((s) => s.id === data.sala_id)?.nombre ?? '—');

    if (errorButacas) {
      this.errores.mostrar(errorButacas.message);
    } else {
      this.butacas.set(butacas ?? []);
    }

    const { data: entradas, error: errorEntradas } =
      await this.entradaServicio.listarPorFuncion(id);

    if (errorEntradas && errorEntradas.code !== TABLA_NO_ENCONTRADA) {
      this.errores.mostrar(errorEntradas.message);
    } else {
      this.entradas.set(entradas ?? []);
    }
  }

  async cambiarEstado() {
    const funcion = this.funcion();
    if (!funcion) return;

    const nuevoEstado = !funcion.activa;
    const { error } = await this.funcionServicio.cambiarEstado(funcion.id, nuevoEstado);

    if (error) {
      this.logger.registrar(Flujo.ModificacionFuncion, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(
        Flujo.ModificacionFuncion,
        TipoEvento.Exito,
        nuevoEstado ? 'activada' : 'desactivada',
      );
      this.funcion.set({ ...funcion, activa: nuevoEstado });
    }
  }

  async eliminarFuncion() {
    const funcion = this.funcion();
    if (!funcion) return;

    const { error } = await this.funcionServicio.eliminar(funcion.id);

    if (error) {
      this.logger.registrar(Flujo.BajaFuncion, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaFuncion, TipoEvento.Exito, funcion.id);
      await this.router.navigate(['/admin/funciones']);
    }
  }
}
