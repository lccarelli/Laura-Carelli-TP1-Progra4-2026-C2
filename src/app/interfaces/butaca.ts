export interface Butaca {
  id: string;
  sala_id: string;
  fila: string;
  numero: number;
  bloque: 'izquierdo' | 'centro' | 'derecho';
  tipo: 'normal' | 'accesible' | 'vip';
}
