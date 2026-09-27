import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pelicula } from '../../interfaces/pelicula';
import { Genero } from '../../interfaces/genero';
import { Poster } from '../poster/poster';
import { EstrellasPipe } from '../../pipes/estrellas/estrellas';

@Component({
  imports: [RouterLink, Poster, EstrellasPipe],
  selector: 'app-tarjeta-pelicula',
  styleUrl: './tarjeta-pelicula.css',
  templateUrl: './tarjeta-pelicula.html',
})
export class TarjetaPelicula {
  @Input({ required: true }) pelicula!: Pelicula;
  @Input() promedio: number | null = null;
  @Input() esEstreno = false;
  @Input() generos: Genero[] = [];
}
