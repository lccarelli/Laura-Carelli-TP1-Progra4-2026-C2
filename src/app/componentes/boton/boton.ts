import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VarianteBoton } from '../variante-boton';

@Component({
  imports: [],
  selector: 'app-boton',
  templateUrl: './boton.html',
})
export class Boton {
  @Input() variante: VarianteBoton = 'claro-negro';
  @Input() tipo: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() ariaLabel: string | null = null;

  @Output() clic = new EventEmitter<void>();
}
