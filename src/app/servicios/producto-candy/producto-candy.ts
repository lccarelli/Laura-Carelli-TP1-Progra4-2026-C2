import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { ProductoCandy } from '../../interfaces/producto-candy';
import { ProductoCandyPorCrear } from '../../interfaces/producto-candy-por-crear';

@Service()
export class ProductoCandyServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'producto_candy';

  listarTodos() {
    return this.supabase.listar<ProductoCandy>(this.tabla);
  }

  listarActivos() {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('activo', true)
      .order('nombre')
      .returns<ProductoCandy[]>();
  }

  buscarPorId(id: string) {
    return this.supabase.obtenerPorId<ProductoCandy>(this.tabla, id);
  }

  crear(producto: ProductoCandyPorCrear) {
    return this.supabase.crear(this.tabla, producto);
  }

  editar({ id, ...datos }: ProductoCandy) {
    return this.supabase.actualizar<ProductoCandy>(this.tabla, id, datos);
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }
}
