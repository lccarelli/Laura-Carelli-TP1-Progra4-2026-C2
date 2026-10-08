import { environment } from '../../environments/environment';

export const BUCKET_IMAGENES = 'imagenes';

const PREFIJO_BUCKET = `${environment.SUPABASE_URL}/storage/v1/object/public/${BUCKET_IMAGENES}/`;

export function esImagenAlmacenada(url: string): boolean {
  return url.startsWith(PREFIJO_BUCKET);
}

export function rutaDeImagen(url: string): string | null {
  return esImagenAlmacenada(url) ? url.slice(PREFIJO_BUCKET.length) : null;
}
