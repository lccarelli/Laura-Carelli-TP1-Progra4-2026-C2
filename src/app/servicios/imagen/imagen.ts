import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { BUCKET_IMAGENES, rutaDeImagen } from '../../utilidades/imagen';

@Service()
export class ImagenServicio {
  private supabase = inject(Supabase);

  guardarDesdeUrl(url: string, carpeta = 'peliculas') {
    return this.supabase.Supabase.functions.invoke<{ url: string }>('guardar-poster', {
      body: { url, carpeta },
    });
  }

  async subirArchivo(archivo: File, carpeta: string) {
    const ruta = `${carpeta}/${crypto.randomUUID()}.${archivo.type.split('/')[1]}`;
    const { error } = await this.supabase.Supabase.storage
      .from(BUCKET_IMAGENES)
      .upload(ruta, archivo);

    if (error) {
      return { data: null, error };
    }

    const { data } = this.supabase.Supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(ruta);

    return { data: { url: data.publicUrl }, error: null };
  }

  async eliminar(url: string | null) {
    const ruta = url ? rutaDeImagen(url) : null;

    if (ruta) {
      await this.supabase.Supabase.storage.from(BUCKET_IMAGENES).remove([ruta]);
    }
  }
}
