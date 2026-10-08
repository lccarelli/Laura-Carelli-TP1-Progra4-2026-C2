import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-estado-punto',
  templateUrl: './estado-punto.html',
  styleUrl: './estado-punto.css',
})
export class EstadoPunto {
  readonly activa = input(false);
}
