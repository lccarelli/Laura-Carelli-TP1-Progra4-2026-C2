export interface Entrada {
  id: string;
  funcion_id: string;
  butaca_id: string;
  estado: 'reservada' | 'vendida';
  reservada_hasta: string | null;
  codigo_compra: string | null;
  sesion_id: string | null;
  creada_en: string;
}
