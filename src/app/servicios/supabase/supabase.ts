import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Service()
export class Supabase {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  public get Supabase() {
    return this.supabase;
  }

  async listar<T>(tabla: string) {
    return this.Supabase.from(tabla).select('*').returns<T[]>();
  }

  async crear<T extends object>(tabla: string, datos: T) {
    return this.Supabase.from(tabla).insert(datos);
  }

  async actualizar<T>(tabla: string, id: string, datos: Partial<T>) {
    return this.Supabase.from(tabla)
      .update(datos as Record<string, unknown>)
      .eq('id', id);
  }

  async eliminar(tabla: string, id: string) {
    return this.Supabase.from(tabla).delete().eq('id', id);
  }
  async obtenerPorId<T>(tabla: string, id: string) {
    return this.Supabase.from(tabla).select('*').eq('id', id).single<T>();
  }
}
