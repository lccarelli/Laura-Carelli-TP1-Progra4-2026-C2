import { OmdbRating, RatingsNormalizados } from '../interfaces/omdb';

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
  return texto.match(/tt\d+/)?.[0] ?? null;
}
