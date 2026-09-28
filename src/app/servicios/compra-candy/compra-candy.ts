import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';

export interface ItemCandy {
  producto_candy_id: string;
  cantidad: number;
}

@Service()
export class CompraCandyServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'compra_candy';

  registrar(codigoCompra: string, items: ItemCandy[]) {
    if (items.length === 0) {
      return Promise.resolve({ error: null });
    }

    return this.supabase.Supabase.from(this.tabla).insert(
      items.map((item) => ({ codigo_compra: codigoCompra, ...item })),
    );
  }
}
