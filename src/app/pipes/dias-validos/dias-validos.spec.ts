import { DiasValidosPipe } from './dias-validos';

describe('DiasValidosPipe', () => {
  it('crea la instancia', () => {
    expect(new DiasValidosPipe()).toBeTruthy();
  });

  it('muestra "Todos los días" cuando no hay restricción', () => {
    expect(new DiasValidosPipe().transform(null)).toBe('Todos los días');
    expect(new DiasValidosPipe().transform([])).toBe('Todos los días');
  });

  it('muestra los días elegidos, ordenados y con nombre', () => {
    expect(new DiasValidosPipe().transform([3])).toBe('Miércoles');
    expect(new DiasValidosPipe().transform([5, 3])).toBe('Miércoles, Viernes');
  });
});
