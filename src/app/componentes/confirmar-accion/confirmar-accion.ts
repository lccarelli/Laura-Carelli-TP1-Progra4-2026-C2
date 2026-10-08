import { Component, input, output } from '@angular/core';
import { Boton } from '../boton/boton';

@Component({
  imports: [Boton],
  selector: 'app-confirmar-accion',
  styleUrl: './confirmar-accion.css',
  templateUrl: './confirmar-accion.html',
})
export class ConfirmarAccion {
  readonly mensaje = input.required<string>();
  readonly etiqueta = input('Eliminar');

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
