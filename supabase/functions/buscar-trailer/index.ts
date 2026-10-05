import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')!;

const YOUTUBE_URL = 'https://www.googleapis.com/youtube/v3/search';
const CANTIDAD_RESULTADOS = 5;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResultadoYoutube {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium?: { url: string }; default?: { url: string } };
  };
}

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
    const { consulta }: { consulta?: string } = await req.json();

    if (!consulta?.trim()) {
      return json({ error: 'Falta el texto de búsqueda' }, 400);
    }

    const parametros = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoEmbeddable: 'true',
      maxResults: String(CANTIDAD_RESULTADOS),
      q: consulta.trim(),
      key: YOUTUBE_API_KEY,
    });

    const respuesta = await fetch(`${YOUTUBE_URL}?${parametros}`);
    const cuerpo = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(cuerpo.error?.message ?? 'Error de YouTube');
    }

    const resultados = (cuerpo.items as ResultadoYoutube[]).map((item) => ({
      id: item.id.videoId,
      titulo: item.snippet.title,
      canal: item.snippet.channelTitle,
      miniatura:
        item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? null,
    }));

    return json({ ok: true, resultados });
  } catch (error) {
    const mensaje = (error as { message?: string })?.message ?? String(error);

    return json({ error: mensaje }, 500);
  }
});
