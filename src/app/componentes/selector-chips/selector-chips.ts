import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OpcionChip } from './opcion-chip';

@Component({
  imports: [],
  selector: 'app-selector-chips',
  templateUrl: './selector-chips.html',
  styleUrl: './selector-chips.css',
})
export class SelectorChips {
  @Input() opciones: OpcionChip[] = [];
  @Input() seleccionados = new Set<string | number>();

  @Output() alternar = new EventEmitter<string | number>();
}
