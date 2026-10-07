import { Component, input, output } from '@angular/core';
import { PasoCompra, puedeIrA } from '../../utilidades/pasos-compra';

const PESTANAS: { paso: PasoCompra; etiqueta: string }[] = [
  { paso: 'butacas', etiqueta: '1 · Butacas' },
  { paso: 'candy', etiqueta: '2 · Candy' },
  { paso: 'pago', etiqueta: '3 · Pagar' },
];

@Component({
  selector: 'app-pasos-compra',
  styleUrl: './pasos-compra.css',
  templateUrl: './pasos-compra.html',
})
export class PasosCompra {
  readonly paso = input.required<PasoCompra>();
  readonly pasoMaximo = input.required<PasoCompra>();
  readonly elegir = output<PasoCompra>();

  protected pestanas = PESTANAS;

  protected disponible(destino: PasoCompra): boolean {
    return puedeIrA(destino, this.pasoMaximo());
  }
}
