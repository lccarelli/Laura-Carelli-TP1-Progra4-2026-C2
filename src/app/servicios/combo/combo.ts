import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Combo } from '../../interfaces/combo';
import { ComboPorCrear } from '../../interfaces/combo-por-crear';

export interface ItemProductoCombo {
  producto_candy_id: string;
  cantidad: number;
}

export interface ProductoDeCombo {
  producto_candy_id: string;
  cantidad: number;
  producto_candy: { nombre: string } | null;
}

export interface ComboConProductos extends Combo {
  combo_producto: ProductoDeCombo[];
}

const SELECT_CON_PRODUCTOS =
  '*, combo_producto(producto_candy_id, cantidad, producto_candy(nombre))';

@Service()
export class ComboServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'combo';

  listarTodos() {
    return this.supabase.Supabase.from(this.tabla)
      .select(SELECT_CON_PRODUCTOS)
      .order('nombre')
      .returns<ComboConProductos[]>();
  }

  listarActivos() {
    return this.supabase.Supabase.from(this.tabla)
      .select(SELECT_CON_PRODUCTOS)
      .eq('activo', true)
      .order('precio')
      .returns<ComboConProductos[]>();
  }

  buscarPorId(id: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select(SELECT_CON_PRODUCTOS)
      .eq('id', id)
      .single<ComboConProductos>();
  }

  crear(combo: ComboPorCrear) {
    return this.supabase.Supabase.from(this.tabla).insert(combo).select().returns<Combo[]>();
  }

  editar({ id, ...datos }: ComboPorCrear & { id: string }) {
    return this.supabase.actualizar<Combo>(this.tabla, id, datos);
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }

  async asignarProductos(comboId: string, items: ItemProductoCombo[]) {
    const { error: errorBorrado } = await this.supabase.Supabase.from('combo_producto')
      .delete()
      .eq('combo_id', comboId);

    if (errorBorrado || items.length === 0) {
      return { error: errorBorrado };
    }

    return this.supabase.Supabase.from('combo_producto').insert(
      items.map((item) => ({ combo_id: comboId, ...item })),
    );
  }
}
