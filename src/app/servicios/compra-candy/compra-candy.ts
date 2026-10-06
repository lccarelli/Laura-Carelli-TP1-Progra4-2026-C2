import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';

export interface ItemCandy {
  producto_candy_id: string;
  cantidad: number;
}

export interface ItemCandyDeCompra {
  id: string;
  cantidad: number;
  cantidad_entregada: number;
  producto_candy: { nombre: string } | null;
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

  listarPorCodigo(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('id, cantidad, cantidad_entregada, producto_candy(nombre)')
      .eq('codigo_compra', codigoCompra)
      .returns<ItemCandyDeCompra[]>();
  }

  entregar(itemId: string, cantidad: number) {
    return this.supabase.Supabase.rpc('entregar_candy', {
      item_id: itemId,
      cantidad_param: cantidad,
    });
  }
}
