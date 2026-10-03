import { createClient } from 'npm:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GMAIL_USER = Deno.env.get('GMAIL_USER')!;
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatosEnvio {
  premioId: string;
  premioNombre: string;
  costoPuntos: number;
  montoDescuento: number | null;
}

interface ClienteFila {
  id: string;
}

function minificarHtml(html: string): string {
  return html
    .replace(/>\s+</g, '><')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function armarHtml(
  premioNombre: string,
  costoPuntos: number,
  montoDescuento: number | null,
): string {
  const descuentoHtml =
    montoDescuento !== null
      ? `<p style="font-size:14px; margin:0 0 16px;">Te descuenta <strong>$${montoDescuento}</strong> al pagar tus entradas.</p>`
      : '';

  return minificarHtml(`
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f2f0ea; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border:3px solid #131313;">
        <div style="background:#131313; padding:16px 24px;">
          <div style="font-family:'Helvetica Neue', Arial, sans-serif; font-size:22px; font-weight:800; line-height:0.95; letter-spacing:-0.3px; text-transform:uppercase; color:#f2f0ea;">
            <div>Cine</div>
            <div>Kimena</div>
          </div>
        </div>

        <div style="padding:24px;">
          <h1 style="font-size:20px; margin:0 0 12px; color:#131313;">Ya podés canjear un premio</h1>
          <p style="font-size:16px; font-weight:700; margin:0 0 8px;">${premioNombre}</p>
          <p style="font-size:14px; margin:0 0 16px;">Te cuesta <strong>${costoPuntos} puntos</strong>, y ya los tenés disponibles.</p>
          ${descuentoHtml}
          <p style="font-size:13px; color:#666; margin:20px 0 0;">
            Canjealo desde "Mis puntos" la próxima vez que compres entradas.
          </p>
        </div>
      </div>
    </div>
  `);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { premioId, premioNombre, costoPuntos, montoDescuento }: DatosEnvio = await req.json();

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

    // La tabla cliente no guarda el mail (vive en Supabase Auth); lo
    // resolvemos con la API de admin, que sólo el service role puede usar.
    const emailsPorId = new Map<string, string>();
    let pagina = 1;

    for (;;) {
      const { data, error } = await supabase.auth.admin.listUsers({ page: pagina, perPage: 1000 });

      if (error) {
        throw error;
      }

      for (const usuario of data.users) {
        if (usuario.email) {
          emailsPorId.set(usuario.id, usuario.email);
        }
      }

      if (data.users.length < 1000) {
        break;
      }

      pagina++;
    }

    const destinatarios = clienteIds
      .map((id) => emailsPorId.get(id))
      .filter((email): email is string => !!email);

    const client = new SMTPClient({
      connection: {
        hostname: 'smtp.gmail.com',
        port: 465,
        tls: true,
        auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
      },
    });

    const html = armarHtml(premioNombre, costoPuntos, montoDescuento);
    let enviados = 0;
    const errores: { email: string; detalle: string }[] = [];

    try {
      for (const email of destinatarios) {
        try {
          await client.send({
            from: `kínema <${GMAIL_USER}>`,
            to: email,
            subject: `Ya podés canjear: ${premioNombre}`,
            html,
          });
          enviados++;
        } catch (error) {
          console.error('Fallo el envio a', email, error);
          errores.push({ email, detalle: String(error) });
        }
      }
    } finally {
      await client.close();
    }

    return new Response(
      JSON.stringify({ ok: true, elegibles: destinatarios.length, enviados, errores }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const mensaje = (error as { message?: string })?.message ?? String(error);

    return new Response(JSON.stringify({ error: mensaje }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
