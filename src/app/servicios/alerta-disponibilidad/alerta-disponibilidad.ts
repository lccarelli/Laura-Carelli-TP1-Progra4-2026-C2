import { Service, inject } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Auth } from '../auth/auth';
import { AlertaDisponibilidad } from '../../interfaces/alerta-disponibilidad';

@Service()
export class AlertaDisponibilidadServicio {
  private supabase = inject(Supabase);
  private auth = inject(Auth);
  private readonly tabla = 'alerta_disponibilidad';

  async buscar(peliculaId: string) {
    const clienteId = this.auth.usuario()?.id;

    if (!clienteId) {
      return { data: null, error: null };
    }

    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('pelicula_id', peliculaId)
      .maybeSingle<AlertaDisponibilidad>();
  }

  async activar(peliculaId: string) {
    const clienteId = this.auth.usuario()?.id;

    if (!clienteId) {
      return { error: new Error('Necesitás iniciar sesión para activar el aviso') };
    }

    const { error } = await this.supabase.Supabase.from(this.tabla).upsert(
      { cliente_id: clienteId, pelicula_id: peliculaId },
      { onConflict: 'cliente_id,pelicula_id' },
    );

    return { error };
  }

  async desactivar(peliculaId: string) {
    const clienteId = this.auth.usuario()?.id;

    if (!clienteId) {
      return { error: null };
    }

    const { error } = await this.supabase.Supabase.from(this.tabla)
      .delete()
      .eq('cliente_id', clienteId)
      .eq('pelicula_id', peliculaId);

    return { error };
  }
}
