import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VarianteBoton } from '../variante-boton';

@Component({
  imports: [RouterLink],
  selector: 'app-boton-link',
  templateUrl: './boton-link.html',
})
export class BotonLink {
  @Input() variante: VarianteBoton = 'claro-negro';
  @Input({ required: true }) ruta!: string | unknown[];
  @Input() ariaLabel: string | null = null;
}
