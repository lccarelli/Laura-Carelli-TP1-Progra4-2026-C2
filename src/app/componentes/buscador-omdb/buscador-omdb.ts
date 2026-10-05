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
import { extraerImdbId } from '../../utilidades/omdb';

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
  protected mensaje = signal('');

  constructor() {
    this.texto.valueChanges
      .pipe(
        map((texto) => texto.trim()),
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => this.mensaje.set('')),
        switchMap((texto) =>
          this.consultar(texto).pipe(
            catchError((error: Error) => {
              this.mensaje.set(
                error.message === OMDB_SIN_RESULTADOS
                  ? 'No se encontraron películas.'
                  : error.message,
              );
              return of([]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((candidatos) => {
        this.cargando.set(false);
        this.candidatos.set(candidatos);
      });
  }

  elegir(candidato: OmdbCandidato) {
    this.cargando.set(true);

    this.omdb.detalle(candidato.imdbID).subscribe({
      next: (detalle) => {
        this.cargando.set(false);
        this.candidatos.set([]);
        this.elegida.emit(detalle);
      },
      error: (error: Error) => {
        this.cargando.set(false);
        this.mensaje.set(error.message);
      },
    });
  }

  private consultar(texto: string): Observable<OmdbCandidato[]> {
    const imdbId = extraerImdbId(texto);

    if (imdbId) {
      this.cargando.set(true);

      return this.omdb.detalle(imdbId).pipe(
        map((detalle) => {
          this.elegida.emit(detalle);
          return [];
        }),
      );
    }

    if (texto.length < 3) {
      return of([]);
    }

    this.cargando.set(true);
    return this.omdb.buscar(texto).pipe(map((respuesta) => respuesta.Search));
  }
}
