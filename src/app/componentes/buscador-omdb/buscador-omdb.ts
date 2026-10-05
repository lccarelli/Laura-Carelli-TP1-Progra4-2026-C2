import { Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Observable,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { OMDB_SIN_RESULTADOS, OmdbServicio } from '../../servicios/omdb/omdb';
import { OmdbCandidato, OmdbDetalle } from '../../interfaces/omdb';
import { extraerImdbId, posterValido } from '../../utilidades/omdb';

const MINIMO_CARACTERES = 3;
const ESPERA_MS = 400;

type Resultado =
  | { tipo: 'inactivo' }
  | { tipo: 'candidatos'; candidatos: OmdbCandidato[] }
  | { tipo: 'detalle'; detalle: OmdbDetalle }
  | { tipo: 'error'; mensaje: string };

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-buscador-omdb',
  styleUrl: './buscador-omdb.css',
  templateUrl: './buscador-omdb.html',
})
export class BuscadorOmdb {
  private omdb = inject(OmdbServicio);

  readonly elegida = output<OmdbDetalle>();

  protected texto = new FormControl('', { nonNullable: true });
  protected candidatos = signal<OmdbCandidato[]>([]);
  protected cargando = signal(false);
  protected error = signal<string | null>(null);
  protected buscado = signal(false);

  constructor() {
    this.texto.valueChanges
      .pipe(
        map((texto) => texto.trim()),
        debounceTime(ESPERA_MS),
        distinctUntilChanged(),
        tap(() => this.cargando.set(true)),
        switchMap((texto) => this.consultar(texto)),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => this.mostrar(resultado));
  }

  posterDe(candidato: OmdbCandidato) {
    return posterValido(candidato.Poster);
  }

  elegir(candidato: OmdbCandidato) {
    this.cargando.set(true);
    this.error.set(null);

    this.omdb.detalle(candidato.imdbID).subscribe({
      next: (detalle) => {
        this.cargando.set(false);
        this.buscado.set(false);
        this.candidatos.set([]);
        this.elegida.emit(detalle);
      },
      error: (error: Error) => {
        this.cargando.set(false);
        this.error.set(error.message);
      },
    });
  }

  private consultar(texto: string): Observable<Resultado> {
    const imdbId = extraerImdbId(texto);

    if (imdbId) {
      return this.omdb.detalle(imdbId).pipe(
        map((detalle): Resultado => ({ tipo: 'detalle', detalle })),
        catchError((error: Error) => of<Resultado>({ tipo: 'error', mensaje: error.message })),
      );
    }

    if (texto.length < MINIMO_CARACTERES) {
      return of<Resultado>({ tipo: 'inactivo' });
    }

    return this.omdb.buscar(texto).pipe(
      map((respuesta): Resultado => ({ tipo: 'candidatos', candidatos: respuesta.Search })),
      catchError((error: Error) =>
        of<Resultado>(
          error.message === OMDB_SIN_RESULTADOS
            ? { tipo: 'candidatos', candidatos: [] }
            : { tipo: 'error', mensaje: error.message },
        ),
      ),
    );
  }

  private mostrar(resultado: Resultado) {
    this.cargando.set(false);
    this.error.set(null);
    this.buscado.set(resultado.tipo === 'candidatos');

    switch (resultado.tipo) {
      case 'inactivo':
        this.candidatos.set([]);
        break;
      case 'candidatos':
        this.candidatos.set(resultado.candidatos);
        break;
      case 'detalle':
        this.candidatos.set([]);
        this.elegida.emit(resultado.detalle);
        break;
      case 'error':
        this.candidatos.set([]);
        this.error.set(resultado.mensaje);
        break;
    }
  }
}
