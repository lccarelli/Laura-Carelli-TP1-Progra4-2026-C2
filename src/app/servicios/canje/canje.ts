import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Canje } from '../../interfaces/canje';

export interface CanjeConDetalle {
  id: string;
  puntos_gastados: number;
  creada_en: string;
  premio: { nombre: string } | null;
}

@Service()
export class CanjeServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'canje';

  canjear(premioId: string) {
    return this.supabase.Supabase.rpc('canjear_premio', {
      premio_id_param: premioId,
    }).returns<Canje>();
  }

  listarPorCliente(clienteId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('id, puntos_gastados, creada_en, premio(nombre)')
      .eq('cliente_id', clienteId)
      .order('creada_en', { ascending: false })
      .returns<CanjeConDetalle[]>();
  }
}
