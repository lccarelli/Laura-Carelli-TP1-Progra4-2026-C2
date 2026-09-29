export interface PremioPorCrear {
  nombre: string;
  costo_puntos: number;
  activa: boolean;
  dias_validos: number[] | null;
  cantidad_entradas: number | null;
}
