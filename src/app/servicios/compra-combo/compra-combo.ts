import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';

export interface ItemCombo {
  combo_id: string;
  cantidad: number;
}

export interface ItemComboDeCompra {
  cantidad: number;
  combo: { nombre: string } | null;
}

@Service()
export class CompraComboServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'compra_combo';

  registrar(codigoCompra: string, items: ItemCombo[]) {
    if (items.length === 0) {
      return Promise.resolve({ error: null });
    }

    return this.supabase.Supabase.from(this.tabla).insert(
      items.map((item) => ({ codigo_compra: codigoCompra, ...item })),
    );
  }

  listarPorCodigo(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('cantidad, combo(nombre)')
      .eq('codigo_compra', codigoCompra)
      .returns<ItemComboDeCompra[]>();
  }
}
