import { Component, input } from '@angular/core';

@Component({
  selector: 'app-aviso-uso',
  styleUrl: './aviso-uso.css',
  templateUrl: './aviso-uso.html',
})
export class AvisoUso {
  readonly titulo = input.required<string>();
  readonly usado = input(false);
}
