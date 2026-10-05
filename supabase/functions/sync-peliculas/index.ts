import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OMDB_API_KEY = Deno.env.get('OMDB_API_KEY')!;
const CRON_SECRET = Deno.env.get('CRON_SECRET')!;

const OMDB_URL = 'https://www.omdbapi.com/';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

interface OmdbRating {
  Source: string;
  Value: string;
}

interface OmdbDetalle {
  Response: string;
  Error?: string;
  Ratings?: OmdbRating[];
}

function mapRatings(ratings: OmdbRating[] = []) {
  const resultado: { imdb: number | null; rotten: number | null; metacritic: number | null } = {
    imdb: null,
    rotten: null,
    metacritic: null,
  };

  for (const { Source, Value } of ratings) {
    const numero = parseFloat(Value);

    if (Number.isNaN(numero)) continue;

    if (Source === 'Internet Movie Database') resultado.imdb = numero;
    else if (Source === 'Rotten Tomatoes') resultado.rotten = numero;
    else if (Source === 'Metacritic') resultado.metacritic = numero;
  }

  return resultado;
}

async function pedirDetalle(imdbId: string): Promise<OmdbDetalle> {
  const url = `${OMDB_URL}?i=${encodeURIComponent(imdbId)}&plot=full&apikey=${OMDB_API_KEY}`;
  const respuesta = await fetch(url);
  const detalle: OmdbDetalle = await respuesta.json();

  if (detalle.Response === 'False') {
    throw new Error(detalle.Error ?? 'Error de OMDb');
  }

  return detalle;
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

  const llamadoPorCron = req.headers.get('x-cron-secret') === CRON_SECRET;

  if (!llamadoPorCron) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data } = await supabase.auth.getUser(token);

    if (data.user?.user_metadata?.role !== 'admin') {
      return json({ error: 'No autorizado' }, 401);
    }
  }

  try {
    const { imdb_id: imdbId }: { imdb_id?: string } = await req.json().catch(() => ({}));

    let consulta = supabase.from('pelicula').select('id, imdb_id').not('imdb_id', 'is', null);

    consulta = imdbId ? consulta.eq('imdb_id', imdbId) : consulta.eq('activa', true);

    const { data: peliculas, error } = await consulta;

    if (error) {
      throw error;
    }

    let actualizadas = 0;
    const errores: { imdb_id: string; detalle: string }[] = [];

    for (const pelicula of peliculas ?? []) {
      try {
        const detalle = await pedirDetalle(pelicula.imdb_id);

        const { error: errorUpdate } = await supabase
          .from('pelicula')
          .update({
            omdb_data: detalle,
            ...mapRatings(detalle.Ratings),
            sincronizado_en: new Date().toISOString(),
          })
          .eq('id', pelicula.id);

        if (errorUpdate) {
          throw errorUpdate;
        }

        actualizadas++;
      } catch (falla) {
        const detalle = (falla as { message?: string })?.message ?? String(falla);

        console.error('Fallo la sincronizacion de', pelicula.imdb_id, detalle);
        errores.push({ imdb_id: pelicula.imdb_id, detalle });
      }
    }

    return json({ ok: true, actualizadas, errores });
  } catch (error) {
    const mensaje = (error as { message?: string })?.message ?? String(error);

    return json({ error: mensaje }, 500);
  }
});
