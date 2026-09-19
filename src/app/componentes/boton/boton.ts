import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VarianteBoton } from '../variante-boton';

@Component({
  imports: [],
  selector: 'app-boton',
  styleUrl: './boton.css',
  templateUrl: './boton.html',
})
export class Boton {
  @Input() variante: VarianteBoton = 'claro-negro';
  @Input() tipo: 'button' | 'submit' = 'button';
  @Input() disabled = false;

  @Output() clic = new EventEmitter<void>();
}
