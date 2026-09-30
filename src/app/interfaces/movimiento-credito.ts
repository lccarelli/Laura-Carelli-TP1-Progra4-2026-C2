export interface MovimientoCredito {
  id: string;
  monto: number;
  motivo: 'cancelacion' | 'compra';
  codigo_compra: string | null;
  creada_en: string;
}
