import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-poster',
  styleUrl: './poster.css',
  templateUrl: './poster.html',
})
export class Poster {
  readonly imagen = input<string | null>(null);
}
