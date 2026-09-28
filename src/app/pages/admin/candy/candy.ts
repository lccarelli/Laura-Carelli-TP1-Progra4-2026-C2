import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProductoCandyServicio } from '../../../servicios/producto-candy/producto-candy';
import { Errores } from '../../../servicios/errores/errores';
import { ProductoCandy } from '../../../interfaces/producto-candy';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

@Component({
  imports: [Boton, BotonLink, DecimalPipe],
  selector: 'app-candy',
  styleUrl: './candy.css',
  templateUrl: './candy.html',
})
export class Candy {
  private productoCandyServicio = inject(ProductoCandyServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected productos = signal<ProductoCandy[]>([]);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.productoCandyServicio.listarTodos();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.productos.set(data ?? []);
    }
  }

  async eliminar(id: string) {
    const { error } = await this.productoCandyServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaCandy, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaCandy, TipoEvento.Exito, id);
      await this.cargar();
    }
  }
}
