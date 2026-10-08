import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VarianteBoton } from '../variante-boton';

@Component({
  imports: [RouterLink],
  selector: 'app-boton-link',
  templateUrl: './boton-link.html',
})
export class BotonLink {
  readonly variante = input<VarianteBoton>('claro-negro');
  readonly ruta = input.required<string | unknown[]>();
  readonly fragment = input<string>();
  readonly queryParams = input<Record<string, string>>();
  readonly ariaLabel = input<string | null>(null);
}
