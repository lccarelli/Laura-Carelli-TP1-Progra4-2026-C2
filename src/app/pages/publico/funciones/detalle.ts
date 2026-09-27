import { Component, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../servicios/sala/sala';
import { EntradaServicio } from '../../../servicios/entrada/entrada';
import { Errores } from '../../../servicios/errores/errores';
import { Funcion } from '../../../interfaces/funcion';
import { Pelicula } from '../../../interfaces/pelicula';
import { Butaca } from '../../../interfaces/butaca';
import { Entrada } from '../../../interfaces/entrada';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { MapaButacas } from '../../../componentes/mapa-butacas/mapa-butacas';
import { Poster } from '../../../componentes/poster/poster';

const TABLA_NO_ENCONTRADA = 'PGRST205';

@Component({
  imports: [BotonLink, MapaButacas, Poster, DatePipe, UpperCasePipe],
  selector: 'app-detalle-funcion',
  styleUrl: './detalle.css',
  templateUrl: './detalle.html',
})
export class Detalle {
  private route = inject(ActivatedRoute);
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private salaServicio = inject(SalaServicio);
  private entradaServicio = inject(EntradaServicio);
  private errores = inject(Errores);

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
}
