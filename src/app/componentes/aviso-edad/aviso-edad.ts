import { Component, input } from '@angular/core';
import { RestriccionEdadPipe } from '../../pipes/restriccion-edad/restriccion-edad';

@Component({
  imports: [RestriccionEdadPipe],
  selector: 'app-aviso-edad',
  styleUrl: './aviso-edad.css',
  templateUrl: './aviso-edad.html',
})
export class AvisoEdad {
  readonly restriccion = input.required<number | null>();
}
