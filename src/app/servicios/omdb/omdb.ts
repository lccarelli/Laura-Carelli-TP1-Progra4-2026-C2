import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OmdbBusqueda, OmdbDetalle, OmdbRespuesta } from '../../interfaces/omdb';

const RESPUESTA_EXITOSA = 'True';
const RESPUESTA_FALLIDA = 'False';
const SIN_RESULTADOS = 'Movie not found!';
const TIPO_PELICULA = 'movie';
const PLOT_FULL = 'full';
const RESPUESTA_BUSQUEDA_VACIA: OmdbBusqueda = {
  Response: RESPUESTA_EXITOSA,
  Search: [],
  totalResults: '0',
};

const ERROR_OMDB = 'Error de OMDb';
const ERROR_SIN_CONEXION = 'Sin conexión con OMDb';
const ERROR_CONSULTA = 'No se pudo consultar OMDb';

@Service()
export class Omdb {
  private http = inject(HttpClient);
  private readonly url = environment.OMDB_URL;

  buscar(texto: string, page = 1): Observable<OmdbBusqueda> {
    return this.consultar<OmdbBusqueda>({ s: texto, type: TIPO_PELICULA, page }).pipe(
      catchError((error: Error) => this.busquedaVaciaSiNoHayResultados(error)),
    );
  }

  detalle(imdbId: string): Observable<OmdbDetalle> {
    return this.consultar<OmdbDetalle>({ i: imdbId, plot: PLOT_FULL });
  }

  private consultar<T extends OmdbRespuesta>(params: Record<string, string | number>) {
    return this.http.get<T>(this.url, { params }).pipe(
      map((respuesta) => this.rechazarSiFallo(respuesta)),
      catchError((error) => this.traducirError(error)),
    );
  }

  private rechazarSiFallo<T extends OmdbRespuesta>(respuesta: T): T {
    if (respuesta.Response === RESPUESTA_FALLIDA) {
      throw new Error(respuesta.Error ?? ERROR_OMDB);
    }

    return respuesta;
  }

  private busquedaVaciaSiNoHayResultados(error: Error) {
    return error.message === SIN_RESULTADOS
      ? of(RESPUESTA_BUSQUEDA_VACIA)
      : throwError(() => error);
  }

  private traducirError(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return throwError(() => new Error(ERROR_SIN_CONEXION));
      }

      const mensaje = (error.error as OmdbRespuesta | null)?.Error;
      return throwError(() => new Error(mensaje ?? ERROR_CONSULTA));
    }

    return throwError(() => error);
  }
}
