import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Auth } from '../auth/auth';
import { Flujo } from './flujo';
import { TipoEvento } from './tipo-evento';

@Service()
export class Logger {
  private supabase = inject(Supabase);
  private auth = inject(Auth);

  registrar(flujo: Flujo, evento: TipoEvento, detalle?: string) {
    const hora = new Date().toLocaleTimeString('es-AR', { hour12: false });
    console.log(`[${hora}] [${flujo}] ${evento}${detalle ? ': ' + detalle : ''}`);

    this.supabase.Supabase.from('log_actividad')
      .insert({
        flujo,
        evento,
        entidad_afectada: detalle ?? null,
        usuario_email: this.auth.usuario()?.email ?? null,
      })
      .then(({ error }) => {
        if (error) {
          console.error('No se pudo guardar el log de auditoría:', error.message);
        }
      });
  }
}
