export interface Funcion {
  id: string;
  pelicula_id: string;
  sala_id: string;
  inicio: string;
  fin: string;
  formato: '2d' | '3d' | '4d' | '5d';
  idioma: 'castellano' | 'subtitulada';
  activa: boolean;
  precio_normal: number;
  precio_accesible: number;
  precio_vip: number;
}
