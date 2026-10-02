import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CompraServicio } from '../../../servicios/compra/compra';
import { ResenaServicio } from '../../../servicios/resena/resena';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { TarjetaPelicula } from '../../../componentes/tarjeta-pelicula/tarjeta-pelicula';
import { Pelicula } from '../../../interfaces/pelicula';

interface PeliculaVista {
  pelicula: Pelicula;
  fecha: string;
  calificacion: number | null;
}

@Component({
  imports: [BotonLink, TarjetaPelicula, DatePipe],
  selector: 'app-mis-peliculas',
  styleUrl: './mis-peliculas.css',
  templateUrl: './mis-peliculas.html',
})
export class MisPeliculas {
  private compraServicio = inject(CompraServicio);
  private resenaServicio = inject(ResenaServicio);
  private auth = inject(Auth);
  private errores = inject(Errores);

  protected peliculasVistas = signal<PeliculaVista[]>([]);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const clienteId = this.auth.usuario()?.id;

    if (!clienteId) {
      return;
    }

    const [{ data: compras, error: errorCompras }, { data: resenas, error: errorResenas }] =
      await Promise.all([
        this.compraServicio.listarPeliculasVistasPorCliente(clienteId),
        this.resenaServicio.listarDeUsuario(clienteId),
      ]);

    const error = errorCompras ?? errorResenas;

    if (error) {
      this.errores.mostrar(error.message);
      return;
    }

    const calificacionPorPelicula = new Map<string, number>();
    for (const resena of resenas ?? []) {
      calificacionPorPelicula.set(resena.pelicula_id, resena.puntaje);
    }

    // Lo que vio es lo que compró: alcanza con la compra no cancelada de
    // una función que ya pasó, no hace falta chequear que escaneó el QR.
    // Si vio la misma película más de una vez, se queda con la fecha más
    // reciente — una tarjeta por película, no una por compra.
    const ahora = Date.now();
    const vistaPorPelicula = new Map<string, PeliculaVista>();

    for (const compra of compras ?? []) {
      const pelicula = compra.funcion?.pelicula;
      const inicio = compra.funcion?.inicio;

      if (!pelicula || !inicio || new Date(inicio).getTime() > ahora) {
        continue;
      }

      const actual = vistaPorPelicula.get(pelicula.id);

      if (!actual || inicio > actual.fecha) {
        vistaPorPelicula.set(pelicula.id, {
          pelicula,
          fecha: inicio,
          calificacion: calificacionPorPelicula.get(pelicula.id) ?? null,
        });
      }
    }

    this.peliculasVistas.set(
      [...vistaPorPelicula.values()].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    );
  }
}
