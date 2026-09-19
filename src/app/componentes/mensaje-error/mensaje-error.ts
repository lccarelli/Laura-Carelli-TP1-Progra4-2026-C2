import { Component, inject } from '@angular/core';
import { Errores } from '../../servicios/errores/errores';

@Component({
  imports: [],
  selector: 'app-mensaje-error',
  styleUrl: './mensaje-error.css',
  templateUrl: './mensaje-error.html',
})
export class MensajeError {
  protected errores = inject(Errores);
}
