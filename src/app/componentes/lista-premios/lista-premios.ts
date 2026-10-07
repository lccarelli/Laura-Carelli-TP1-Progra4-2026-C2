import { Component, input, output } from '@angular/core';
import { PremioAplicable } from '../../interfaces/premio-aplicable';
import { DiasValidosPipe } from '../../pipes/dias-validos/dias-validos';

@Component({
  imports: [DiasValidosPipe],
  selector: 'app-lista-premios',
  styleUrl: './lista-premios.css',
  templateUrl: './lista-premios.html',
})
export class ListaPremios {
  readonly premios = input.required<PremioAplicable[]>();
  readonly seleccionado = input.required<string | null>();
  readonly elegir = output<string>();
}
