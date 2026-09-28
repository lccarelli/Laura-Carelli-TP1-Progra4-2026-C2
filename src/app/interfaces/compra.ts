export interface Compra {
  id: string;
  codigo_compra: string;
  funcion_id: string;
  cliente_id: string | null;
  email: string;
  edad_declarada: number | null;
  total: number;
  creada_en: string;
}
