import { OmdbRating, RatingsNormalizados } from '../interfaces/omdb';

const SIN_DATO = 'N/A';
const REGEX_IMDB_ID = /tt\d+/;

export function mapRatings(ratings: OmdbRating[] | undefined): RatingsNormalizados {
  const resultado: RatingsNormalizados = {};

  for (const { Source, Value } of ratings ?? []) {
    const numero = parseFloat(Value);

    if (Number.isNaN(numero)) continue;

    if (Source === 'Internet Movie Database') resultado.imdb = numero;
    else if (Source === 'Rotten Tomatoes') resultado.rotten = numero;
    else if (Source === 'Metacritic') resultado.metacritic = numero;
  }

  return resultado;
}

export function extraerImdbId(texto: string): string | null {
  return texto.match(REGEX_IMDB_ID)?.[0] ?? null;
}

export function posterValido(poster: string | undefined): string | null {
  return poster && poster !== SIN_DATO ? poster : null;
}

export function duracionEnMinutos(runtime: string): number | null {
  const minutos = parseInt(runtime, 10);
  return Number.isNaN(minutos) ? null : minutos;
}

export function restriccionDesdeClasificacion(clasificacion: string): number | null {
  if (['R', 'NC-17', 'TV-MA'].includes(clasificacion)) return 18;
  if (['PG-13', 'TV-14'].includes(clasificacion)) return 13;
  return null;
}

export function fechaIso(texto: string): string | null {
  if (!texto || texto === SIN_DATO) return null;

  const fecha = new Date(`${texto} UTC`);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString().slice(0, 10);
}
