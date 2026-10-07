export interface OmdbRating {
  Source: string;
  Value: string;
}

export interface OmdbCandidato {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbRespuesta {
  Response?: string;
  Error?: string;
}

export interface OmdbBusqueda extends OmdbRespuesta {
  Search: OmdbCandidato[];
  totalResults: string;
  Response: string;
}

export interface OmdbDetalle extends OmdbRespuesta {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  Ratings: OmdbRating[];
  imdbID: string;
  Response: string;
}

export interface RatingsNormalizados {
  imdb?: number;
  rotten?: number;
  metacritic?: number;
}
