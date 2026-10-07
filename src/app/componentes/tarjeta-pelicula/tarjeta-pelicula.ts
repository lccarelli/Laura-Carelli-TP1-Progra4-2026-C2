import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pelicula } from '../../interfaces/pelicula';
import { Genero } from '../../interfaces/genero';
import { Poster } from '../poster/poster';
import { EstrellasPipe } from '../../pipes/estrellas/estrellas';
import { RestriccionEdadPipe } from '../../pipes/restriccion-edad/restriccion-edad';

@Component({
  imports: [RouterLink, Poster, EstrellasPipe, RestriccionEdadPipe],
  selector: 'app-tarjeta-pelicula',
  styleUrl: './tarjeta-pelicula.css',
  templateUrl: './tarjeta-pelicula.html',
})
export class TarjetaPelicula {
  readonly pelicula = input.required<Pelicula>();
  readonly promedio = input<number | null>(null);
  readonly esEstreno = input(false);
  readonly esPreventa = input(false);
  readonly generos = input<Genero[]>([]);
}
