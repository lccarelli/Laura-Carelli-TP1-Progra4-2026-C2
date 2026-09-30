export interface PeliculaPorCrear {
  nombre: string;
  sinopsis: string | null;
  duracion_minutos: number;
  imagen_url: string | null;
  restriccion_edad: number | null;
  activa: boolean;
  destacada: boolean;
  fecha_estreno: string | null;
  trailer_url: string | null;
  dias_preventa: number | null;
  porcentaje_preventa: number | null;
}
