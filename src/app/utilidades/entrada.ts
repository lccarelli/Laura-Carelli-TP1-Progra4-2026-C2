import { Entrada } from '../interfaces/entrada';

export function entradaVigente(entrada: Entrada): boolean {
  if (entrada.estado === 'vendida') {
    return true;
  }

  return !entrada.reservada_hasta || new Date(entrada.reservada_hasta) > new Date();
}

export function guardarEntrada(entradas: Entrada[], entrada: Entrada): Entrada[] {
  const existe = entradas.some((actual) => actual.id === entrada.id);

  return existe
    ? entradas.map((actual) => (actual.id === entrada.id ? entrada : actual))
    : [...entradas, entrada];
}

export function quitarEntrada(entradas: Entrada[], id: string): Entrada[] {
  return entradas.filter((entrada) => entrada.id !== id);
}
