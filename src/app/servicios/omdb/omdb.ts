import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OmdbBusqueda, OmdbDetalle } from '../../interfaces/omdb';

export const OMDB_SIN_RESULTADOS = 'Movie not found!';

@Service()
export class OmdbServicio {
  private http = inject(HttpClient);
  private readonly url = environment.OMDB_URL;

  buscar(texto: string, page = 1): Observable<OmdbBusqueda> {
    return this.http
      .get<OmdbBusqueda>(this.url, { params: { s: texto, type: 'movie', page } })
      .pipe(catchError((error) => this.traducirError(error)));
  }

  detalle(imdbId: string): Observable<OmdbDetalle> {
    return this.http
      .get<OmdbDetalle>(this.url, { params: { i: imdbId, plot: 'full' } })
      .pipe(catchError((error) => this.traducirError(error)));
  }

  private traducirError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return throwError(() => new Error('Sin conexión con OMDb'));
      }

      const mensaje = (error.error as { Error?: string } | null)?.Error;
      return throwError(() => new Error(mensaje ?? 'No se pudo consultar OMDb'));
    }

    return throwError(() => error);
  }
}
