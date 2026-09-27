export interface Pelicula {
  id: string;
  nombre: string;
  sinopsis: string | null;
  duracion_minutos: number;
  imagen_url: string | null;
  restriccion_edad: number | null;
  activa: boolean;
  destacada: boolean;
  fecha_estreno: string | null;
}
