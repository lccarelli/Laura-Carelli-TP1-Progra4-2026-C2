import { Component, input } from '@angular/core';
import { ComboConProductos } from '../../servicios/combo/combo';
import { ProductoCandy } from '../../interfaces/producto-candy';
import { Cantidades } from '../../utilidades/cantidades';
import { SelectorCantidad } from '../selector-cantidad/selector-cantidad';

@Component({
  imports: [SelectorCantidad],
  selector: 'app-seleccion-candy',
  styleUrl: './seleccion-candy.css',
  templateUrl: './seleccion-candy.html',
})
export class SeleccionCandy {
  readonly combos = input.required<ComboConProductos[]>();
  readonly productos = input.required<ProductoCandy[]>();
  readonly carritoCombos = input.required<Cantidades>();
  readonly carritoCandy = input.required<Cantidades>();

  protected productosDeCombo(combo: ComboConProductos): string {
    return combo.combo_producto
      .map((item) => `${item.cantidad}x ${item.producto_candy?.nombre ?? '—'}`)
      .join(', ');
  }
}
