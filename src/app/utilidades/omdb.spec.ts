import { extraerImdbId, mapRatings } from './omdb';

describe('omdb', () => {
  it('normaliza los ratings de los tres orígenes', () => {
    expect(
      mapRatings([
        { Source: 'Internet Movie Database', Value: '8.8/10' },
        { Source: 'Rotten Tomatoes', Value: '87%' },
        { Source: 'Metacritic', Value: '74/100' },
      ]),
    ).toEqual({ imdb: 8.8, rotten: 87, metacritic: 74 });
  });

  it('deja sin definir los ratings que faltan', () => {
    expect(mapRatings([{ Source: 'Rotten Tomatoes', Value: '40%' }])).toEqual({ rotten: 40 });
    expect(mapRatings(undefined)).toEqual({});
  });

  it('extrae el id de IMDb de un link', () => {
    expect(extraerImdbId('https://www.imdb.com/title/tt0111161/')).toBe('tt0111161');
    expect(extraerImdbId('matrix')).toBeNull();
  });
});
