alter table pelicula
  add column if not exists imdb_id text unique,
  add column if not exists omdb_data jsonb,
  add column if not exists rotten int,
  add column if not exists metacritic int,
  add column if not exists imdb numeric(3, 1);
