export const ORDEN_PASOS = ['butacas', 'candy', 'pago', 'listo'] as const;
export type PasoCompra = (typeof ORDEN_PASOS)[number];

export function puedeIrA(destino: PasoCompra, pasoMaximo: PasoCompra): boolean {
  return ORDEN_PASOS.indexOf(destino) <= ORDEN_PASOS.indexOf(pasoMaximo);
}

export function pasoMasAvanzado(a: PasoCompra, b: PasoCompra): PasoCompra {
  return ORDEN_PASOS.indexOf(a) >= ORDEN_PASOS.indexOf(b) ? a : b;
}
