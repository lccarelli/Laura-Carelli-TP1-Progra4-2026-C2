import { formatearCodigo, generarCodigoCompra, normalizarCodigo } from './codigo-compra';

const UUID = '3f2b8c1e-9a4d-4e7b-8c21-5d6f0a1b2c3d';

describe('codigo de compra', () => {
  describe('generarCodigoCompra', () => {
    it('genera 8 caracteres', () => {
      expect(generarCodigoCompra()).toHaveLength(8);
    });

    it('no usa caracteres que se confunden entre sí', () => {
      for (let i = 0; i < 500; i++) {
        expect(generarCodigoCompra()).not.toMatch(/[01ILO]/);
      }
    });

    it('usa sólo mayúsculas y dígitos', () => {
      for (let i = 0; i < 500; i++) {
        expect(generarCodigoCompra()).toMatch(/^[A-Z2-9]{8}$/);
      }
    });

    it('no repite códigos en una tanda grande', () => {
      const codigos = new Set(Array.from({ length: 2000 }, () => generarCodigoCompra()));

      expect(codigos.size).toBe(2000);
    });
  });

  describe('normalizarCodigo', () => {
    it('pasa a mayúsculas y saca espacios y guiones', () => {
      expect(normalizarCodigo(' k7m4-9qxt ')).toBe('K7M49QXT');
      expect(normalizarCodigo('K7M4 9QXT')).toBe('K7M49QXT');
    });

    it('deja igual un código ya normalizado', () => {
      expect(normalizarCodigo('K7M49QXT')).toBe('K7M49QXT');
    });

    it('conserva el UUID de las compras anteriores', () => {
      expect(normalizarCodigo(UUID)).toBe(UUID);
      expect(normalizarCodigo(` ${UUID.toUpperCase()} `)).toBe(UUID);
    });
  });

  describe('formatearCodigo', () => {
    it('separa el código en dos grupos de 4', () => {
      expect(formatearCodigo('K7M49QXT')).toBe('K7M4-9QXT');
    });

    it('no toca el UUID de las compras anteriores', () => {
      expect(formatearCodigo(UUID)).toBe(UUID);
    });

    it('es la inversa de normalizarCodigo', () => {
      const codigo = generarCodigoCompra();

      expect(normalizarCodigo(formatearCodigo(codigo))).toBe(codigo);
    });
  });
});
