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
  premioId: string;
  premioNombre: string;
  costoPuntos: number;
}

interface ClienteFila {
  id: string;
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
    const { premioId, premioNombre, costoPuntos }: DatosEnvio = await req.json();

    const { data: elegibles, error: errorElegibles } = await supabase
      .from('cliente')
      .select('id')
      .gte('puntos', costoPuntos)
      .returns<ClienteFila[]>();

    if (errorElegibles) {
      throw errorElegibles;
    }

    if (!elegibles || elegibles.length === 0) {
      return new Response(JSON.stringify({ ok: true, enviados: 0 }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { data: canjes, error: errorCanjes } = await supabase
      .from('canje')
      .select('cliente_id')
      .eq('premio_id', premioId);

    if (errorCanjes) {
      throw errorCanjes;
    }

    const yaLoCanjearon = new Set((canjes ?? []).map((c) => c.cliente_id as string));
    const clienteIds = elegibles
      .map((cliente) => cliente.id)
      .filter((id) => !yaLoCanjearon.has(id));

    if (clienteIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, enviados: 0 }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

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
        title: '¡Nuevo premio disponible!',
        body: `Ya podés canjear "${premioNombre}" con tus puntos.`,
        data: { url: '/mis-puntos' },
      },
    });

    let enviados = 0;
    const errores: { endpoint: string; detalle: string }[] = [];

    for (const suscripcion of suscripciones ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: suscripcion.endpoint,
            keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
          },
          payload,
        );
        enviados++;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        const detalle = (error as { body?: string; message?: string }).body ?? String(error);

        console.error('Fallo el envio a', suscripcion.endpoint, 'status', statusCode, detalle);
        errores.push({ endpoint: suscripcion.endpoint, detalle: `${statusCode}: ${detalle}` });

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_suscripcion').delete().eq('endpoint', suscripcion.endpoint);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, elegibles: clienteIds.length, enviados, errores }),
      {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    const mensaje = (error as { message?: string })?.message ?? String(error);

    return new Response(JSON.stringify({ error: mensaje }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
