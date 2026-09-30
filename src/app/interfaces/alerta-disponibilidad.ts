export interface AlertaDisponibilidad {
  id: string;
  cliente_id: string;
  pelicula_id: string;
  estado: 'pendiente' | 'notificada';
  creada_en: string;
}
