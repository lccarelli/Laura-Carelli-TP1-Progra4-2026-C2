export interface Resena {
  id: string;
  pelicula_id: string;
  usuario_id: string;
  puntaje: number;
  texto: string | null;
  creada_en: string;
}
