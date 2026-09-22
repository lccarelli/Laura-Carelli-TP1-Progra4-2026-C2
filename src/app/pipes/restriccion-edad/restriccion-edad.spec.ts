import { RestriccionEdadPipe } from './restriccion-edad';

describe('RestriccionEdadPipe', () => {
  it('crea la instancia', () => {
    expect(new RestriccionEdadPipe()).toBeTruthy();
  });

  it('muestra el "+" con la edad cuando hay restricción', () => {
    expect(new RestriccionEdadPipe().transform(13)).toBe('+13');
  });

  it('muestra "Sin restricción" cuando no hay restricción', () => {
    expect(new RestriccionEdadPipe().transform(null)).toBe('Sin restricción');
  });
});
