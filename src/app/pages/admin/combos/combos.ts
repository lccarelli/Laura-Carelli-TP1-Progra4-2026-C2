import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ComboServicio, ComboConProductos } from '../../../servicios/combo/combo';
import { Errores } from '../../../servicios/errores/errores';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

@Component({
  imports: [Boton, BotonLink, DecimalPipe],
  selector: 'app-combos',
  styleUrl: './combos.css',
  templateUrl: './combos.html',
})
export class Combos {
  private comboServicio = inject(ComboServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected combos = signal<ComboConProductos[]>([]);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.comboServicio.listarTodos();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.combos.set(data ?? []);
    }
  }

  protected productosDe(combo: ComboConProductos): string {
    return combo.combo_producto
      .map((item) => `${item.cantidad}x ${item.producto_candy?.nombre ?? '—'}`)
      .join(', ');
  }

  async eliminar(id: string) {
    const { error } = await this.comboServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaCombo, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaCombo, TipoEvento.Exito, id);
      await this.cargar();
    }
  }
}
