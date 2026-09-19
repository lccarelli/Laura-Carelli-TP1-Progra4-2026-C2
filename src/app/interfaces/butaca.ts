export interface Butaca {
  id: string;
  sala_id: string;
  fila: string;
  numero: number;
  bloque: 'izquierda' | 'centro' | 'derecha';
  tipo: 'normal' | 'accesible' | 'vip';
}
