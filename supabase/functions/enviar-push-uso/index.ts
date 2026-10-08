import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
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

type TipoUso = 'entrada' | 'candy';

interface DatosEnvio {
  codigoCompra: string;
  tipo: TipoUso;
}

interface SuscripcionFila {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface CompraFila {
  cliente_id: string | null;
  funcion: { pelicula: { nombre: string } | null } | null;
}

const MENSAJES: Record<
  TipoUso,
  (pelicula: string, codigo: string) => { title: string; body: string }
> = {
  entrada: (pelicula, codigo) => ({
    title: 'Entrada utilizada',
    body: `Tu entrada para ${pelicula} fue validada en la puerta. Código ${codigo}.`,
  }),
  candy: (pelicula, codigo) => ({
    title: 'Candy retirado',
    body: `Retiraste tu candy de la compra para ${pelicula}. Código ${codigo}.`,
  }),
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { codigoCompra, tipo }: DatosEnvio = await req.json();

    if (tipo !== 'entrada' && tipo !== 'candy') {
      throw new Error('Tipo de uso inválido');
    }

    const { data: compra, error: errorCompra } = await supabase
      .from('compra')
      .select('cliente_id, funcion(pelicula(nombre))')
      .eq('codigo_compra', codigoCompra)
      .maybeSingle<CompraFila>();

    if (errorCompra) {
      throw errorCompra;
    }

    // Compra anónima: no hay a quién avisar.
    if (!compra?.cliente_id) {
      return respuesta({ ok: true, enviados: 0 });
    }

    // Sólo se avisa si el uso realmente quedó registrado en la base.
    const registrado =
      tipo === 'entrada'
        ? await hayEntradaValidada(supabase, codigoCompra)
        : await hayCandyEntregado(supabase, codigoCompra);

    if (!registrado) {
      return respuesta({ ok: true, enviados: 0 });
    }

    const { data: suscripciones, error: errorSuscripciones } = await supabase
      .from('push_suscripcion')
      .select('endpoint, p256dh, auth')
      .eq('cliente_id', compra.cliente_id)
      .returns<SuscripcionFila[]>();

    if (errorSuscripciones) {
      throw errorSuscripciones;
    }

    const pelicula = compra.funcion?.pelicula?.nombre ?? 'tu función';
    const { title, body } = MENSAJES[tipo](pelicula, codigoCompra);
    const payload = JSON.stringify({
      notification: { title, body, data: { url: '/mis-compras' } },
    });

    let enviados = 0;

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

        console.error('Fallo el envio a', suscripcion.endpoint, 'status', statusCode);

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_suscripcion').delete().eq('endpoint', suscripcion.endpoint);
        }
      }
    }

    return respuesta({ ok: true, enviados });
  } catch (error) {
    const mensaje = (error as { message?: string })?.message ?? String(error);

    return respuesta({ error: mensaje }, 500);
  }
});

function respuesta(cuerpo: object, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function hayEntradaValidada(
  supabase: SupabaseClient,
  codigoCompra: string,
): Promise<boolean> {
  const { count } = await supabase
    .from('entrada')
    .select('id', { count: 'exact', head: true })
    .eq('codigo_compra', codigoCompra)
    .not('validada_en', 'is', null);

  return (count ?? 0) > 0;
}

async function hayCandyEntregado(supabase: SupabaseClient, codigoCompra: string): Promise<boolean> {
  for (const tabla of ['compra_candy', 'compra_combo']) {
    const { count } = await supabase
      .from(tabla)
      .select('id', { count: 'exact', head: true })
      .eq('codigo_compra', codigoCompra)
      .gt('cantidad_entregada', 0);

    if ((count ?? 0) > 0) {
      return true;
    }
  }

  return false;
}
