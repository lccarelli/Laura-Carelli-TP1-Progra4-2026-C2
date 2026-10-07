import { CodigoCompraPipe } from './codigo-compra';

describe('CodigoCompraPipe', () => {
  const pipe = new CodigoCompraPipe();

  it('muestra el código en dos grupos', () => {
    expect(pipe.transform('K7M49QXT')).toBe('K7M4-9QXT');
  });

  it('devuelve vacío si no hay código', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
