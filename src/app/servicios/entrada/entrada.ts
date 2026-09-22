import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Entrada } from '../../interfaces/entrada';

@Service()
export class EntradaServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'entrada';

  listarPorFuncion(funcionId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('funcion_id', funcionId)
      .in('estado', ['reservada', 'vendida'])
      .returns<Entrada[]>();
  }
}
