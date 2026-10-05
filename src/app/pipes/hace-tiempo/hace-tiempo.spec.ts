import { HaceTiempoPipe } from './hace-tiempo';

describe('HaceTiempoPipe', () => {
  const pipe = new HaceTiempoPipe();
  const ahora = new Date('2026-10-05T12:00:00Z');

  it('avisa cuando nunca se sincronizó', () => {
    expect(pipe.transform(null, ahora)).toBe('Sin sincronizar');
  });

  it('expresa la antigüedad en la unidad más grande', () => {
    expect(pipe.transform('2026-10-05T09:00:00Z', ahora)).toBe('Actualizado hace 3 horas');
    expect(pipe.transform('2026-10-04T11:00:00Z', ahora)).toBe('Actualizado hace 1 día');
    expect(pipe.transform('2026-10-05T11:55:00Z', ahora)).toBe('Actualizado hace 5 minutos');
  });
});
