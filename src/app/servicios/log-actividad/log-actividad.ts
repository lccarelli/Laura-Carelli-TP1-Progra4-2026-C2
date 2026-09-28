import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { LogActividad } from '../../interfaces/log-actividad';

const LIMITE = 300;

@Service()
export class LogActividadServicio {
  private supabase = inject(Supabase);

  listar() {
    return this.supabase.Supabase.from('log_actividad')
      .select('*')
      .order('creada_en', { ascending: false })
      .limit(LIMITE)
      .returns<LogActividad[]>();
  }
}
