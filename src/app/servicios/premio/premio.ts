import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Premio } from '../../interfaces/premio';
import { PremioPorCrear } from '../../interfaces/premio-por-crear';

@Service()
export class PremioServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'premio';

  listarTodas() {
    return this.supabase.listar<Premio>(this.tabla);
  }

  listarActivas() {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('activa', true)
      .order('costo_puntos')
      .returns<Premio[]>();
  }

  crear(premio: PremioPorCrear) {
    return this.supabase.crear(this.tabla, premio);
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }
}
