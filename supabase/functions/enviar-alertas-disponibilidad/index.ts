import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_MAILTO = Deno.env.get('VAPID_MAILTO')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

interface DatosEnvio {
  peliculaId: string;
  peliculaNombre: string;
}

interface AlertaFila {
  id: string;
  cliente_id: string;
}

interface SuscripcionFila {
  cliente_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { peliculaId, peliculaNombre }: DatosEnvio = await req.json();

    const { data: alertas, error: errorAlertas } = await supabase
      .from('alerta_disponibilidad')
      .select('id, cliente_id')
      .eq('pelicula_id', peliculaId)
      .eq('estado', 'pendiente')
      .returns<AlertaFila[]>();

    if (errorAlertas) {
      throw errorAlertas;
    }

    if (!alertas || alertas.length === 0) {
      return new Response(JSON.stringify({ ok: true, notificados: 0 }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const clienteIds = alertas.map((alerta) => alerta.cliente_id);

    const { data: suscripciones, error: errorSuscripciones } = await supabase
      .from('push_suscripcion')
      .select('cliente_id, endpoint, p256dh, auth')
      .in('cliente_id', clienteIds)
      .returns<SuscripcionFila[]>();

    if (errorSuscripciones) {
      throw errorSuscripciones;
    }

    const payload = JSON.stringify({
      notification: {
        title: 'Ya podés comprar entradas',
        body: `${peliculaNombre} ya tiene funciones a la venta.`,
        data: { url: `/peliculas/${peliculaId}` },
      },
    });

    const errores: { endpoint: string; detalle: string }[] = [];

    // clientes a los que les llegó el push al menos a una suscripción —
    // sólo su alerta se marca como notificada. Si falló (y no es un
    // 404/410 de suscripción muerta), la alerta queda en "pendiente" para
    // reintentarse la próxima vez que se dispare esta función.
    const clientesNotificados = new Set<string>();

    for (const suscripcion of suscripciones ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: suscripcion.endpoint,
            keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
          },
          payload,
        );
        clientesNotificados.add(suscripcion.cliente_id);
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        const detalle = (error as { body?: string; message?: string }).body ?? String(error);

        console.error('Fallo el envio a', suscripcion.endpoint, 'status', statusCode, detalle);
        errores.push({ endpoint: suscripcion.endpoint, detalle: `${statusCode}: ${detalle}` });

        // 404/410 = el navegador dio de baja esa suscripción del lado del
        // servicio de push; ya no sirve, la borramos para no reintentarla.
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_suscripcion').delete().eq('endpoint', suscripcion.endpoint);
        }
      }
    }

    const idsAlertasNotificadas = alertas
      .filter((alerta) => clientesNotificados.has(alerta.cliente_id))
      .map((alerta) => alerta.id);

    if (idsAlertasNotificadas.length > 0) {
      await supabase
        .from('alerta_disponibilidad')
        .update({ estado: 'notificada' })
        .in('id', idsAlertasNotificadas);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        notificados: idsAlertasNotificadas.length,
        pendientes: alertas.length - idsAlertasNotificadas.length,
        suscripciones: suscripciones?.length ?? 0,
        errores,
      }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
