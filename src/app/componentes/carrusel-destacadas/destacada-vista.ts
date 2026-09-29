import { Pelicula } from '../../interfaces/pelicula';
import { Genero } from '../../interfaces/genero';

export interface DestacadaVista {
  pelicula: Pelicula;
  promedio: number | null;
  esEstreno: boolean;
  generos: Genero[];
}
