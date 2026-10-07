import { Entrada } from '../interfaces/entrada';

export function entradaVigente(entrada: Entrada): boolean {
  if (entrada.estado === 'vendida') {
    return true;
  }

  return !entrada.reservada_hasta || new Date(entrada.reservada_hasta) > new Date();
}
