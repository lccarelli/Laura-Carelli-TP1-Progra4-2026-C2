import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Resena } from '../../interfaces/resena';
import { ResenaPorCrear } from '../../interfaces/resena-por-crear';

@Service()
export class ResenaServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'resena';

  listarTodas() {
    return this.supabase.Supabase.from(this.tabla)
      .select('pelicula_id, puntaje')
      .returns<Pick<Resena, 'pelicula_id' | 'puntaje'>[]>();
  }

  listarPorPelicula(peliculaId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('creada_en', { ascending: false })
      .returns<Resena[]>();
  }

  buscarDeUsuario(peliculaId: string, usuarioId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('pelicula_id', peliculaId)
      .eq('usuario_id', usuarioId)
      .maybeSingle<Resena>();
  }

  crear(resena: ResenaPorCrear) {
    return this.supabase.crear(this.tabla, resena);
  }
}
