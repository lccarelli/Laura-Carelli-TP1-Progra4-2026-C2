import { calcularEdad, cumpleEdadMinima } from './edad';

describe('edad', () => {
  describe('calcularEdad', () => {
    it('cuenta los años cumplidos', () => {
      expect(calcularEdad('2000-06-15T12:00:00', new Date(2026, 9, 7))).toBe(26);
    });

    it('no suma el año si todavía no cumplió en el mes', () => {
      expect(calcularEdad('2000-12-15T12:00:00', new Date(2026, 9, 7))).toBe(25);
    });

    it('no suma el año si cumple más tarde en el mismo mes', () => {
      expect(calcularEdad('2000-10-20T12:00:00', new Date(2026, 9, 7))).toBe(25);
    });

    it('suma el año el día del cumpleaños', () => {
      expect(calcularEdad('2000-10-07T12:00:00', new Date(2026, 9, 7))).toBe(26);
    });
  });

  describe('cumpleEdadMinima', () => {
    it('acepta a cualquiera si no hay edad mínima', () => {
      expect(cumpleEdadMinima(null, null)).toBe(true);
      expect(cumpleEdadMinima(10, null)).toBe(true);
      expect(cumpleEdadMinima(null, 0)).toBe(true);
    });

    it('acepta la edad igual o mayor a la mínima', () => {
      expect(cumpleEdadMinima(16, 16)).toBe(true);
      expect(cumpleEdadMinima(30, 16)).toBe(true);
    });

    it('rechaza una edad menor', () => {
      expect(cumpleEdadMinima(15, 16)).toBe(false);
    });

    it('rechaza si hay mínima y no se conoce la edad', () => {
      expect(cumpleEdadMinima(null, 16)).toBe(false);
    });
  });
});
