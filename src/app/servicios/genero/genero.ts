import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Genero } from '../../interfaces/genero';
import { GeneroPorCrear } from '../../interfaces/genero-por-crear';

interface FilaPeliculaGenero {
  genero: Genero;
}

@Service()
export class GeneroServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'genero';

  listar() {
    return this.supabase.listar<Genero>(this.tabla);
  }

  crear(genero: GeneroPorCrear) {
    return this.supabase.crear(this.tabla, genero);
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }

  async listarAsignaciones() {
    return this.supabase.Supabase.from('pelicula_genero')
      .select('pelicula_id, genero(id, nombre)')
      .returns<{ pelicula_id: string; genero: Genero }[]>();
  }

  async listarPorPelicula(peliculaId: string) {
    const { data, error } = await this.supabase.Supabase.from('pelicula_genero')
      .select('genero(id, nombre)')
      .eq('pelicula_id', peliculaId)
      .returns<FilaPeliculaGenero[]>();

    return { data: data?.map((fila) => fila.genero) ?? null, error };
  }

  async asignarAPelicula(peliculaId: string, generoIds: string[]) {
    const { error: errorBorrado } = await this.supabase.Supabase.from('pelicula_genero')
      .delete()
      .eq('pelicula_id', peliculaId);

    if (errorBorrado || generoIds.length === 0) {
      return { error: errorBorrado };
    }

    return this.supabase.Supabase.from('pelicula_genero').insert(
      generoIds.map((generoId) => ({ pelicula_id: peliculaId, genero_id: generoId })),
    );
  }
}
