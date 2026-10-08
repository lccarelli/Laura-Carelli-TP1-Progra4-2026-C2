import { avisoDeConservadas, descripcionDeBaja } from './baja-funciones';

describe('baja de funciones', () => {
  describe('avisoDeConservadas', () => {
    it('no avisa si se eliminó todo', () => {
      expect(avisoDeConservadas(0)).toBeNull();
    });

    it('avisa en singular con una sola', () => {
      expect(avisoDeConservadas(1)).toContain('Una función no se eliminó');
    });

    it('avisa en plural con varias e indica la cantidad', () => {
      expect(avisoDeConservadas(3)).toContain('3 funciones no se eliminaron');
    });
  });

  describe('descripcionDeBaja', () => {
    it('usa singular y plural', () => {
      expect(descripcionDeBaja(1)).toBe('1 función');
      expect(descripcionDeBaja(4)).toBe('4 funciones');
    });
  });
});
