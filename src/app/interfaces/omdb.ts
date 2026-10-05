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

export interface OmdbBusqueda {
  Search: OmdbCandidato[];
  totalResults: string;
  Response: string;
}

export interface OmdbDetalle {
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
