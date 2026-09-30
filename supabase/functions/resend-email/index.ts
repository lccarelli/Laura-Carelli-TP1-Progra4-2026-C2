import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const GMAIL_USER = Deno.env.get('GMAIL_USER')!;
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')!;
const LOGO_URL = 'https://laura-carelli-tp-1-progra4-2026-c2.vercel.app/pop-corn.png';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatosEnvio {
  email: string;
  codigoCompra: string;
  qrBase64: string;
  posterUrl: string | null;
  peliculaNombre: string;
  restriccionTexto: string;
  sala: string;
  diaHora: string;
  formato: string;
  idioma: string;
  butacasTexto: string[];
  candyTexto: string[];
  total: number;
  descuentoCupon: number;
}

function armarHtml(datos: DatosEnvio): string {
  const posterHtml = datos.posterUrl
    ? `<img src="${datos.posterUrl}" alt="Poster" width="220" style="display:block; max-width:220px; width:100%; height:auto; border:2px solid #131313; margin-bottom:16px;" />`
    : '';

  const candyHtml =
    datos.candyTexto.length > 0
      ? `
        <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:0.06em; margin:20px 0 8px;">Candy</h3>
        <ul style="margin:0; padding-left:18px; font-size:14px;">
          ${datos.candyTexto.map((linea) => `<li>${linea}</li>`).join('')}
        </ul>
      `
      : '';

  const avisoAdultoHtml =
    datos.restriccionTexto !== 'Sin restricción'
      ? `<p style="background:#ffdca0; border:1.5px solid #131313; color:#131313; font-weight:700; font-size:13px; padding:8px 12px; margin:0 0 16px;">
          Esta función es ${datos.restriccionTexto}: debe ir acompañado de un adulto responsable.
        </p>`
      : '';

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background:#f2f0ea; padding:24px;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border:3px solid #131313;">
        <div style="background:#131313; padding:16px 24px; display:flex; align-items:center; gap:12px;">
          <span style="display:inline-block; background:#ffffff; padding:6px; border-radius:8px; line-height:0;">
            <img src="${LOGO_URL}" alt="kínema" width="24" height="24" style="display:block;" />
          </span>
          <span style="color:#f2f0ea; font-size:20px; font-weight:800; vertical-align:middle;">KÍNEMA</span>
        </div>

        <div style="padding:24px;">
          <h1 style="font-size:22px; margin:0 0 4px; color:#131313;">${datos.peliculaNombre}</h1>
          <p style="display:inline-block; border:1.5px solid #131313; padding:2px 8px; font-size:12px; font-weight:700; text-transform:uppercase; margin:0 0 16px;">
            ${datos.restriccionTexto}
          </p>

          ${avisoAdultoHtml}

          ${posterHtml}

          <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:20px;">
            <tr><td style="padding:4px 0; color:#666;">Sala</td><td style="padding:4px 0; text-align:right; font-weight:700;">${datos.sala}</td></tr>
            <tr><td style="padding:4px 0; color:#666;">Día y hora</td><td style="padding:4px 0; text-align:right; font-weight:700;">${datos.diaHora}</td></tr>
            <tr><td style="padding:4px 0; color:#666;">Formato</td><td style="padding:4px 0; text-align:right; font-weight:700;">${datos.formato.toUpperCase()}</td></tr>
            <tr><td style="padding:4px 0; color:#666;">Idioma</td><td style="padding:4px 0; text-align:right; font-weight:700;">${datos.idioma}</td></tr>
          </table>

          <h3 style="font-size:14px; text-transform:uppercase; letter-spacing:0.06em; margin:0 0 8px;">Tus butacas</h3>
          <ul style="margin:0 0 8px; padding-left:18px; font-size:14px;">
            ${datos.butacasTexto.map((linea) => `<li>${linea}</li>`).join('')}
          </ul>

          ${candyHtml}

          ${
            datos.descuentoCupon > 0
              ? `<p style="font-size:14px; font-weight:700; color:#2e7d32; margin:20px 0 0; border-top:1px solid #ddd; padding-top:12px;">
                  Cupón de bienvenida: -$${datos.descuentoCupon}
                </p>`
              : ''
          }
          <p style="font-size:18px; font-weight:800; margin:${datos.descuentoCupon > 0 ? '4px' : '20px'} 0 20px;">
            Total: $${datos.total}
          </p>

          <div style="text-align:center; border-top:2px solid #131313; padding-top:20px; margin-top:8px;">
            <p style="font-size:14px; margin:0 0 12px;">Mostrá este código QR en boletería para retirar tu entrada:</p>
            <img src="cid:qr" alt="Código QR" width="180" height="180" style="display:inline-block; max-width:180px; width:100%; height:auto; border:2px solid #131313;" />
            <p style="font-family:monospace; font-size:12px; margin:12px 0 0; word-break:break-all;">
              Código: ${datos.codigoCompra}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: {
        username: GMAIL_USER,
        password: GMAIL_APP_PASSWORD,
      },
    },
  });

  try {
    const datos: DatosEnvio = await req.json();

    const attachments = [
      {
        filename: 'qr.png',
        contentType: 'image/png',
        encoding: 'base64' as const,
        content: datos.qrBase64,
        contentID: 'qr',
      },
    ];

    await client.send({
      from: `kínema <${GMAIL_USER}>`,
      to: datos.email,
      subject: `Tu entrada - ${datos.peliculaNombre}`,
      html: armarHtml(datos),
      attachments,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } finally {
    await client.close();
  }
});
