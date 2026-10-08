import { Seleccion } from './seleccion';

describe('Seleccion', () => {
  let seleccion: Seleccion;

  beforeEach(() => {
    seleccion = new Seleccion();
  });

  it('arranca vacía', () => {
    expect(seleccion.cantidad()).toBe(0);
    expect(seleccion.ids()).toEqual([]);
    expect(seleccion.tiene('a')).toBe(false);
  });

  describe('alternar', () => {
    it('agrega un id que no estaba', () => {
      seleccion.alternar('a');

      expect(seleccion.tiene('a')).toBe(true);
      expect(seleccion.cantidad()).toBe(1);
    });

    it('quita un id que ya estaba', () => {
      seleccion.alternar('a');
      seleccion.alternar('a');

      expect(seleccion.tiene('a')).toBe(false);
      expect(seleccion.cantidad()).toBe(0);
    });

    it('conserva los demás ids', () => {
      seleccion.alternar('a');
      seleccion.alternar('b');
      seleccion.alternar('a');

      expect(seleccion.ids()).toEqual(['b']);
    });
  });

  describe('alternarTodos', () => {
    it('elige todos si faltaba alguno', () => {
      seleccion.alternar('a');

      seleccion.alternarTodos(['a', 'b', 'c']);

      expect(seleccion.ids()).toEqual(['a', 'b', 'c']);
    });

    it('quita todos si ya estaban elegidos', () => {
      seleccion.alternarTodos(['a', 'b']);

      seleccion.alternarTodos(['a', 'b']);

      expect(seleccion.cantidad()).toBe(0);
    });

    it('con una lista vacía no elige nada', () => {
      seleccion.alternarTodos([]);

      expect(seleccion.cantidad()).toBe(0);
    });
  });

  describe('incluye', () => {
    it('es verdadero sólo si están todos', () => {
      seleccion.alternar('a');

      expect(seleccion.incluye(['a'])).toBe(true);
      expect(seleccion.incluye(['a', 'b'])).toBe(false);
    });

    it('es falso con una lista vacía', () => {
      expect(seleccion.incluye([])).toBe(false);
    });
  });

  it('limpiar descarta todo', () => {
    seleccion.alternarTodos(['a', 'b']);

    seleccion.limpiar();

    expect(seleccion.cantidad()).toBe(0);
  });
});
