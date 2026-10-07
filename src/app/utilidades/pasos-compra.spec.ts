import { ORDEN_PASOS, pasoMasAvanzado, puedeIrA } from './pasos-compra';

describe('pasos de la compra', () => {
  it('van de butacas a listo, en ese orden', () => {
    expect(ORDEN_PASOS).toEqual(['butacas', 'candy', 'pago', 'listo']);
  });

  describe('puedeIrA', () => {
    it('permite volver a un paso ya alcanzado', () => {
      expect(puedeIrA('butacas', 'pago')).toBe(true);
      expect(puedeIrA('candy', 'pago')).toBe(true);
    });

    it('permite quedarse en el paso máximo', () => {
      expect(puedeIrA('candy', 'candy')).toBe(true);
    });

    it('no permite saltar a un paso que todavía no se alcanzó', () => {
      expect(puedeIrA('candy', 'butacas')).toBe(false);
      expect(puedeIrA('pago', 'candy')).toBe(false);
    });
  });

  describe('pasoMasAvanzado', () => {
    it('devuelve el más avanzado de los dos', () => {
      expect(pasoMasAvanzado('butacas', 'pago')).toBe('pago');
      expect(pasoMasAvanzado('listo', 'candy')).toBe('listo');
    });

    it('devuelve el mismo si son iguales', () => {
      expect(pasoMasAvanzado('candy', 'candy')).toBe('candy');
    });
  });
});
