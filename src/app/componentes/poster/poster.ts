import { Component, Input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-poster',
  styleUrl: './poster.css',
  templateUrl: './poster.html',
})
export class Poster {
  @Input() imagen: string | null = null;
}
