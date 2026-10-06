import { Service, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { Supabase } from '../supabase/supabase';
import { Auth } from '../auth/auth';
import { environment } from '../../../environments/environment';

const TIEMPO_MAXIMO_SUSCRIPCION_MS = 15000;

@Service()
export class PushServicio {
  private swPush = inject(SwPush);
  private supabase = inject(Supabase);
  private auth = inject(Auth);
  private router = inject(Router);
  private readonly tabla = 'push_suscripcion';

  constructor() {
    if (!this.swPush.isEnabled) {
      return;
    }

    this.swPush.notificationClicks.subscribe(({ notification }) => {
      const url = notification.data?.url;

      if (url) {
        this.router.navigateByUrl(url);
      }
    });
  }

  get habilitado(): boolean {
    return this.swPush.isEnabled;
  }

  async suscribir() {
    if (!this.swPush.isEnabled) {
      return { error: new Error('Este navegador no admite notificaciones push') };
    }

    const clienteId = this.auth.usuario()?.id;

    if (!clienteId) {
      return { error: new Error('Necesitás iniciar sesión para activar notificaciones') };
    }

    let suscripcion;

    try {
      suscripcion = await Promise.race([
        this.swPush.requestSubscription({ serverPublicKey: environment.VAPID_PUBLIC_KEY }),
        new Promise<never>((_, rechazar) =>
          setTimeout(
            () =>
              rechazar(
                new Error('No hubo respuesta del servicio de notificaciones. Revisá tu conexión.'),
              ),
            TIEMPO_MAXIMO_SUSCRIPCION_MS,
          ),
        ),
      ]);
    } catch (error) {
      return { error: error as Error };
    }

    const { endpoint, keys } = suscripcion.toJSON();

    if (!keys) {
      return { error: new Error('El navegador no devolvió las claves de la suscripción') };
    }

    const { error } = await this.supabase.Supabase.from(this.tabla).upsert(
      {
        cliente_id: clienteId,
        endpoint,
        p256dh: keys['p256dh'],
        auth: keys['auth'],
      },
      { onConflict: 'cliente_id,endpoint' },
    );

    return { error };
  }
}
