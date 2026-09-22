import { EstrellasPipe } from './estrellas';

describe('EstrellasPipe', () => {
  it('crea la instancia', () => {
    expect(new EstrellasPipe()).toBeTruthy();
  });

  it('transforma el puntaje en estrellas llenas y vacías', () => {
    expect(new EstrellasPipe().transform(3)).toBe('★★★☆☆');
  });

  it('devuelve todas las estrellas llenas con puntaje 5', () => {
    expect(new EstrellasPipe().transform(5)).toBe('★★★★★');
  });
});
