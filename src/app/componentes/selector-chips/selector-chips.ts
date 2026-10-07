import { Component, input, output } from '@angular/core';
import { OpcionChip } from './opcion-chip';

@Component({
  imports: [],
  selector: 'app-selector-chips',
  templateUrl: './selector-chips.html',
  styleUrl: './selector-chips.css',
})
export class SelectorChips {
  readonly opciones = input<OpcionChip[]>([]);
  readonly seleccionados = input<ReadonlySet<string | number>>(new Set<string | number>());
  readonly variante = input<'pill' | 'rectangular'>('pill');

  readonly alternar = output<string | number>();
}
