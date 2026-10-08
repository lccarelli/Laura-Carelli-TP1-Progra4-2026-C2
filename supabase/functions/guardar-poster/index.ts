import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BUCKET = 'imagenes';
const CARPETAS = ['peliculas', 'candy'];
const TAMANO_MAXIMO_BYTES = 3 * 1024 * 1024;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
  const { data } = await supabase.auth.getUser(token);

  if (data.user?.user_metadata?.role !== 'admin') {
    return json({ error: 'No autorizado' }, 401);
  }

  try {
    const { url, carpeta = 'peliculas' }: { url?: string; carpeta?: string } = await req.json();

    if (!CARPETAS.includes(carpeta)) {
      return json({ error: 'Carpeta no permitida' }, 400);
    }

    if (!url || !url.startsWith('https://')) {
      return json({ error: 'La imagen tiene que ser una URL https' }, 400);
    }

    const respuesta = await fetch(url);

    if (!respuesta.ok) {
      return json({ error: `No se pudo descargar la imagen (${respuesta.status})` }, 400);
    }

    const tipo = respuesta.headers.get('content-type')?.split(';')[0] ?? '';

    if (!tipo.startsWith('image/')) {
      return json({ error: 'La URL no es una imagen' }, 400);
    }

    const bytes = await respuesta.arrayBuffer();

    if (bytes.byteLength > TAMANO_MAXIMO_BYTES) {
      return json({ error: 'La imagen supera los 3 MB' }, 413);
    }

    const extension = tipo.split('/')[1].replace('jpeg', 'jpg');
    const ruta = `${carpeta}/${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, bytes, { contentType: tipo });

    if (error) {
      throw error;
    }

    const { data: publica } = supabase.storage.from(BUCKET).getPublicUrl(ruta);

    return json({ ok: true, url: publica.publicUrl });
  } catch (error) {
    const mensaje = (error as { message?: string })?.message ?? String(error);

    return json({ error: mensaje }, 500);
  }
});
