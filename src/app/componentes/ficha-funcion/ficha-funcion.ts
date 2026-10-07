import { DatePipe, UpperCasePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { Funcion } from '../../interfaces/funcion';
import { Pelicula } from '../../interfaces/pelicula';
import { Poster } from '../poster/poster';

@Component({
  imports: [Poster, DatePipe, UpperCasePipe],
  selector: 'app-ficha-funcion',
  styleUrl: './ficha-funcion.css',
  templateUrl: './ficha-funcion.html',
})
export class FichaFuncion {
  readonly funcion = input.required<Funcion>();
  readonly pelicula = input.required<Pelicula | null>();
  readonly sala = input.required<string>();
}
