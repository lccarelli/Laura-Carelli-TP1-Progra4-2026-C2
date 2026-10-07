import { Component, OnDestroy, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Observable,
  Subscription,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { Omdb } from '../../servicios/omdb/omdb';
import { OmdbCandidato, OmdbDetalle } from '../../interfaces/omdb';
import { extraerImdbId } from '../../utilidades/omdb';

const ESPERA_TIPEO_MS = 400;
const MINIMO_CARACTERES = 3;
const MENSAJE_SIN_RESULTADOS = 'No se encontraron películas.';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-buscador-omdb',
  styleUrl: './buscador-omdb.css',
  templateUrl: './buscador-omdb.html',
})
export class BuscadorOmdb implements OnDestroy {
  private omdb = inject(Omdb);
  private eleccion?: Subscription;

  readonly elegida = output<OmdbDetalle>();

  protected texto = new FormControl('', { nonNullable: true });
  protected candidatos = signal<OmdbCandidato[]>([]);
  protected cargando = signal(false);
  protected mensaje = signal('');

  constructor() {
    this.escucharTexto();
  }

  ngOnDestroy() {
    this.eleccion?.unsubscribe();
  }

  elegir(candidato: OmdbCandidato) {
    this.eleccion?.unsubscribe();
    this.cargando.set(true);

    this.eleccion = this.omdb.detalle(candidato.imdbID).subscribe({
      next: (detalle) => this.confirmarEleccion(detalle),
      error: (error: Error) => this.mostrarError(error),
    });
  }

  private escucharTexto() {
    this.textoTipeado()
      .pipe(
        switchMap((texto) => this.consultar(texto)),
        takeUntilDestroyed(),
      )
      .subscribe((candidatos) => this.mostrarCandidatos(candidatos));
  }

  private textoTipeado(): Observable<string> {
    return this.texto.valueChanges.pipe(
      map((texto) => texto.trim()),
      debounceTime(ESPERA_TIPEO_MS),
      distinctUntilChanged(),
      tap(() => this.mensaje.set('')),
    );
  }

  private consultar(texto: string): Observable<OmdbCandidato[]> {
    return this.buscarSegunTexto(texto).pipe(
      catchError((error: Error) => this.sinCandidatos(error)),
    );
  }

  private buscarSegunTexto(texto: string): Observable<OmdbCandidato[]> {
    const imdbId = extraerImdbId(texto);

    if (imdbId) {
      return this.cargarPorId(imdbId);
    }

    if (texto.length < MINIMO_CARACTERES) {
      return of([]);
    }

    return this.buscarPorTitulo(texto);
  }

  private cargarPorId(imdbId: string): Observable<OmdbCandidato[]> {
    this.cargando.set(true);

    return this.omdb.detalle(imdbId).pipe(
      tap((detalle) => this.elegida.emit(detalle)),
      map(() => []),
    );
  }

  private buscarPorTitulo(texto: string): Observable<OmdbCandidato[]> {
    this.cargando.set(true);

    return this.omdb.buscar(texto).pipe(
      tap((respuesta) => {
        if (respuesta.Search.length === 0) {
          this.mensaje.set(MENSAJE_SIN_RESULTADOS);
        }
      }),
      map((respuesta) => respuesta.Search),
    );
  }

  private mostrarCandidatos(candidatos: OmdbCandidato[]) {
    this.cargando.set(false);
    this.candidatos.set(candidatos);
  }

  private confirmarEleccion(detalle: OmdbDetalle) {
    this.mostrarCandidatos([]);
    this.elegida.emit(detalle);
  }

  private sinCandidatos(error: Error): Observable<OmdbCandidato[]> {
    this.mostrarError(error);
    return of([]);
  }

  private mostrarError(error: Error) {
    this.cargando.set(false);
    this.mensaje.set(error.message);
  }
}
