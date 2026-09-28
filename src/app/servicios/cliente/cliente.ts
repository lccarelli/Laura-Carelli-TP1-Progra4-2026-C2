import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Cliente } from '../../interfaces/cliente';

@Service()
export class ClienteServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'cliente';

  async obtenerOCrear(id: string) {
    const { data, error } = await this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('id', id)
      .maybeSingle<Cliente>();

    if (error) {
      return { data: null, error };
    }

    if (data) {
      return { data, error: null };
    }

    return this.supabase.Supabase.from(this.tabla).insert({ id }).select('*').single<Cliente>();
  }

  usarCuponBienvenida() {
    return this.supabase.Supabase.rpc('usar_cupon_bienvenida');
  }
}
