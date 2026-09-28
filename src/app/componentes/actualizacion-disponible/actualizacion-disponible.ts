import { Component, inject } from '@angular/core';
import { Actualizacion } from '../../servicios/actualizacion/actualizacion';

@Component({
  imports: [],
  selector: 'app-actualizacion-disponible',
  styleUrl: './actualizacion-disponible.css',
  templateUrl: './actualizacion-disponible.html',
})
export class ActualizacionDisponible {
  protected actualizacion = inject(Actualizacion);
}
