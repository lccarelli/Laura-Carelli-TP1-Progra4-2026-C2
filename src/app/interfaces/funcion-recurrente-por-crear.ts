export interface FuncionRecurrentePorCrear {
  pelicula_id: string;
  dias: number[];
  hora: string;
  desde: string;
  hasta: string;
  formato: '2d' | '3d' | '4d' | '5d';
  idioma: 'castellano' | 'subtitulada';
}
