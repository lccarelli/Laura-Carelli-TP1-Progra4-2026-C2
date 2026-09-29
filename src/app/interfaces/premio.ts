export interface Premio {
  id: string;
  nombre: string;
  costo_puntos: number;
  activa: boolean;
  dias_validos: number[] | null;
  cantidad_entradas: number | null;
  creada_en: string;
}
