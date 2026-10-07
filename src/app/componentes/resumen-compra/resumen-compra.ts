import { Component, computed, input, output } from '@angular/core';
import { Butaca } from '../../interfaces/butaca';
import { LineaDescuento } from '../../interfaces/linea-descuento';
import { LineaResumen } from '../../interfaces/linea-resumen';
import { PremioAplicable } from '../../interfaces/premio-aplicable';
import { ListaPremios } from '../lista-premios/lista-premios';

@Component({
  imports: [ListaPremios],
  selector: 'app-resumen-compra',
  styleUrl: './resumen-compra.css',
  templateUrl: './resumen-compra.html',
})
export class ResumenCompra {
  readonly butacas = input.required<Butaca[]>();
  readonly combos = input.required<LineaResumen[]>();
  readonly candy = input.required<LineaResumen[]>();
  readonly premios = input.required<PremioAplicable[]>();
  readonly premioSeleccionado = input.required<string | null>();
  readonly descuentos = input.required<LineaDescuento[]>();
  readonly total = input.required<number>();

  readonly elegirPremio = output<string>();

  protected cantidadVip = computed(
    () => this.butacas().filter((butaca) => butaca.tipo === 'vip').length,
  );
}
