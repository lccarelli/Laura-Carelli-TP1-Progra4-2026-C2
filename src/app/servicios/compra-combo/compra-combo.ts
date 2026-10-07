import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';

export interface ItemCombo {
  combo_id: string;
  cantidad: number;
}

export interface ItemComboDeCompra {
  id: string;
  cantidad: number;
  cantidad_entregada: number;
  combo: { nombre: string } | null;
}

@Service()
export class CompraComboServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'compra_combo';

  listarPorCodigo(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('id, cantidad, cantidad_entregada, combo(nombre)')
      .eq('codigo_compra', codigoCompra)
      .returns<ItemComboDeCompra[]>();
  }

  entregar(itemId: string, cantidad: number) {
    return this.supabase.Supabase.rpc('entregar_combo', {
      item_id: itemId,
      cantidad_param: cantidad,
    });
  }
}
