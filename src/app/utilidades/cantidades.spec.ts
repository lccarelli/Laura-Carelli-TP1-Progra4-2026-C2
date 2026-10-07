import { Cantidades } from './cantidades';

describe('Cantidades', () => {
  let cantidades: Cantidades;

  beforeEach(() => {
    cantidades = new Cantidades();
  });

  it('arranca en 0 para cualquier id', () => {
    expect(cantidades.de('a')).toBe(0);
    expect(cantidades.valores().size).toBe(0);
  });

  it('suma de a uno', () => {
    cantidades.sumar('a');
    cantidades.sumar('a');

    expect(cantidades.de('a')).toBe(2);
  });

  it('lleva cada id por separado', () => {
    cantidades.sumar('a');
    cantidades.sumar('b');
    cantidades.sumar('b');

    expect(cantidades.de('a')).toBe(1);
    expect(cantidades.de('b')).toBe(2);
  });

  it('resta de a uno', () => {
    cantidades.sumar('a');
    cantidades.sumar('a');
    cantidades.restar('a');

    expect(cantidades.de('a')).toBe(1);
  });

  it('al llegar a 0 saca el id del mapa', () => {
    cantidades.sumar('a');
    cantidades.restar('a');

    expect(cantidades.de('a')).toBe(0);
    expect(cantidades.valores().has('a')).toBe(false);
  });

  it('restar un id que no está no hace nada', () => {
    cantidades.restar('a');

    expect(cantidades.de('a')).toBe(0);
    expect(cantidades.valores().size).toBe(0);
  });

  it('cada cambio produce un mapa nuevo, para que las señales se enteren', () => {
    const antes = cantidades.valores();

    cantidades.sumar('a');

    expect(cantidades.valores()).not.toBe(antes);
    expect(antes.size).toBe(0);
  });
});
