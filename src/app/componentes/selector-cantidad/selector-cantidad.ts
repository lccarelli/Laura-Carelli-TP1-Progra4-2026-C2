import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-selector-cantidad',
  styleUrl: './selector-cantidad.css',
  templateUrl: './selector-cantidad.html',
})
export class SelectorCantidad {
  readonly cantidad = input.required<number>();
  readonly sumar = output<void>();
  readonly restar = output<void>();
}
