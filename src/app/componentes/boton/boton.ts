import { Component, input, output } from '@angular/core';
import { VarianteBoton } from '../variante-boton';

@Component({
  imports: [],
  selector: 'app-boton',
  templateUrl: './boton.html',
})
export class Boton {
  readonly variante = input<VarianteBoton>('claro-negro');
  readonly tipo = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | null>(null);

  readonly clic = output<void>();
}
