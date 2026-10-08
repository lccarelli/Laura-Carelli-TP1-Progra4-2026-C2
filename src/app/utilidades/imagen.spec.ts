import { environment } from '../../environments/environment';
import { esImagenAlmacenada, rutaDeImagen } from './imagen';

describe('imagen', () => {
  const propia = `${environment.SUPABASE_URL}/storage/v1/object/public/imagenes/peliculas/a.jpg`;

  it('reconoce una imagen que ya está en el bucket', () => {
    expect(esImagenAlmacenada(propia)).toBe(true);
  });

  it('no toma como propia una imagen de otro sitio', () => {
    expect(esImagenAlmacenada('https://m.media-amazon.com/images/M/a.jpg')).toBe(false);
    expect(esImagenAlmacenada('')).toBe(false);
  });

  it('obtiene la ruta dentro del bucket', () => {
    expect(rutaDeImagen(propia)).toBe('peliculas/a.jpg');
  });

  it('no da ruta para una imagen externa', () => {
    expect(rutaDeImagen('https://m.media-amazon.com/images/M/a.jpg')).toBeNull();
  });
});
