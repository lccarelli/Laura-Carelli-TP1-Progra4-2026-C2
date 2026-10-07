import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { GeneroServicio } from '../../../../servicios/genero/genero';
import { Errores } from '../../../../servicios/errores/errores';
import { PeliculaPorCrear } from '../../../../interfaces/pelicula-por-crear';
import { Genero } from '../../../../interfaces/genero';
import { OmdbDetalle } from '../../../../interfaces/omdb';
import { Boton } from '../../../../componentes/boton/boton';
import { BotonLink } from '../../../../componentes/boton-link/boton-link';
import { BuscadorTrailer } from '../../../../componentes/buscador-trailer/buscador-trailer';
import { BuscadorOmdb } from '../../../../componentes/buscador-omdb/buscador-omdb';
import { SelectorChips } from '../../../../componentes/selector-chips/selector-chips';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';
import { mapRatings } from '../../../../utilidades/omdb';
import { traduccionDisponible, traducirAlEspanol } from '../../../../utilidades/traducir';

@Component({
  imports: [ReactiveFormsModule, Boton, BotonLink, BuscadorOmdb, BuscadorTrailer, SelectorChips],
  selector: 'app-formulario',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class Formulario implements OnDestroy {
  private peliculaServicio = inject(PeliculaServicio);
  private generoServicio = inject(GeneroServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logger = inject(Logger);

  protected id = signal<string | null>(null);
  protected activa = signal(true);
  protected destacada = signal(false);
  protected enProximamente = signal(false);
  protected avisarNotificaciones = signal(true);
  protected imagenRota = signal(false);
  protected omdb = signal<OmdbDetalle | null>(null);
  protected imdbIdVinculado = signal<string | null>(null);
  protected puedeTraducir = traduccionDisponible;
  protected traduciendo = signal(false);
  protected duplicada = signal<{ id: string; nombre: string } | null>(null);
  protected generos = signal<Genero[]>([]);
  protected generosSeleccionados = signal<Set<string>>(new Set());

  protected opcionesGenero = computed(() =>
    this.generos().map((genero) => ({ valor: genero.id, etiqueta: genero.nombre })),
  );

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    sinopsis: [''],
    duracion_minutos: [0, [Validators.required, Validators.min(1)]],
    imagen_url: [''],
    restriccion_edad: [''],
    fecha_estreno: [''],
    trailer_url: [''],
    dias_preventa: [''],
    porcentaje_preventa: [''],
  });

  protected nombre = signal('');
  protected fechaEstreno = signal('');
  protected trailerUrl = signal('');
  protected imagenUrl = signal('');
  private suscripcion?: Subscription;

  protected consultaTrailer = computed(() => {
    const anio = this.fechaEstreno().slice(0, 4);
    return [this.nombre(), anio, 'trailer oficial'].filter(Boolean).join(' ');
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    this.cargarGeneros();

    if (id) {
      this.id.set(id);
      this.cargar(id);
    }

    this.suscripcion = this.formulario.valueChanges.subscribe(() => this.copiarCampos());
  }

  ngOnDestroy() {
    this.suscripcion?.unsubscribe();
  }

  private copiarCampos() {
    const { nombre, fecha_estreno, trailer_url, imagen_url } = this.formulario.getRawValue();

    if (imagen_url !== this.imagenUrl()) {
      this.imagenRota.set(false);
    }

    this.nombre.set(nombre);
    this.fechaEstreno.set(fecha_estreno);
    this.trailerUrl.set(trailer_url);
    this.imagenUrl.set(imagen_url);
  }

  async elegirDeOmdb(detalle: OmdbDetalle) {
    const { data: existente } = await this.peliculaServicio.buscarPorImdbId(detalle.imdbID);

    if (existente && existente.id !== this.id()) {
      this.omdb.set(null);
      this.duplicada.set(existente);
      return;
    }

    this.duplicada.set(null);
    this.omdb.set(detalle);

    this.formulario.patchValue({
      ...(this.id() ? {} : { nombre: detalle.Title }),
      sinopsis: detalle.Plot !== 'N/A' ? detalle.Plot : '',
      duracion_minutos: parseInt(detalle.Runtime) || 0,
      imagen_url: detalle.Poster !== 'N/A' ? detalle.Poster : '',
    });
  }

  async traducirSinopsis() {
    const control = this.formulario.controls.sinopsis;

    if (!control.value || this.traduciendo()) return;

    this.traduciendo.set(true);

    try {
      control.setValue(await traducirAlEspanol(control.value));
    } catch {
      this.errores.mostrar('No se pudo traducir. Probá con Chrome de escritorio actualizado.');
    } finally {
      this.traduciendo.set(false);
    }
  }

  elegirTrailer(url: string) {
    this.formulario.controls.trailer_url.setValue(url);
  }

  quitarOmdb() {
    this.omdb.set(null);
  }

  imagenFallo() {
    this.imagenRota.set(true);
  }

  async cargarGeneros() {
    const { data, error } = await this.generoServicio.listar();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.generos.set(data ?? []);
    }
  }

  alternarGenero(valor: string | number) {
    const id = String(valor);
    const seleccionados = new Set(this.generosSeleccionados());

    if (seleccionados.has(id)) {
      seleccionados.delete(id);
    } else {
      seleccionados.add(id);
    }

    this.generosSeleccionados.set(seleccionados);
  }

  async cargar(id: string) {
    const [{ data, error }, { data: generosDePelicula }] = await Promise.all([
      this.peliculaServicio.buscarPorId(id),
      this.generoServicio.listarPorPelicula(id),
    ]);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró la película');
      return;
    }

    this.formulario.setValue({
      nombre: data.nombre,
      sinopsis: data.sinopsis ?? '',
      duracion_minutos: data.duracion_minutos,
      imagen_url: data.imagen_url ?? '',
      restriccion_edad: data.restriccion_edad ? String(data.restriccion_edad) : '',
      fecha_estreno: data.fecha_estreno ?? '',
      trailer_url: data.trailer_url ?? '',
      dias_preventa: data.dias_preventa !== null ? String(data.dias_preventa) : '',
      porcentaje_preventa:
        data.porcentaje_preventa !== null ? String(data.porcentaje_preventa) : '',
    });
    this.imdbIdVinculado.set(data.imdb_id);
    this.activa.set(data.activa);
    this.destacada.set(data.destacada);
    this.enProximamente.set(data.en_proximamente);
    this.avisarNotificaciones.set(data.avisar_notificaciones);
    this.generosSeleccionados.set(new Set((generosDePelicula ?? []).map((g) => g.id)));
  }

  alternarDestacada() {
    this.destacada.update((valor) => !valor);
  }

  alternarEnProximamente() {
    this.enProximamente.update((valor) => !valor);
  }

  alternarAvisarNotificaciones() {
    this.avisarNotificaciones.update((valor) => !valor);
  }

  async cambiarEstado() {
    const id = this.id();
    if (!id) return;

    const nuevoEstado = !this.activa();
    const { error } = await this.peliculaServicio.cambiarEstado(id, nuevoEstado);

    if (error) {
      this.logger.registrar(Flujo.ModificacionPelicula, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(
        Flujo.ModificacionPelicula,
        TipoEvento.Exito,
        nuevoEstado ? 'activada' : 'desactivada',
      );
      this.activa.set(nuevoEstado);
    }
  }

  async eliminarPelicula() {
    const id = this.id();
    if (!id) return;

    const { error } = await this.peliculaServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaPelicula, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaPelicula, TipoEvento.Exito, id);
      await this.router.navigate(['/admin/peliculas']);
    }
  }

  async guardar() {
    const valores = this.valoresParaGuardar();
    const idExistente = this.id();
    const flujo = idExistente ? Flujo.ModificacionPelicula : Flujo.AltaPelicula;

    let peliculaId: string;

    if (idExistente) {
      const { error } = await this.peliculaServicio.editar({ ...valores, id: idExistente });

      if (error) {
        this.logger.registrar(flujo, TipoEvento.Error, error.message);
        this.errores.mostrar(error.message);
        return;
      }

      peliculaId = idExistente;
    } else {
      const { data, error } = await this.peliculaServicio.crear(valores);

      if (error || !data) {
        const mensaje = error?.message ?? 'No se pudo crear la película.';
        this.logger.registrar(flujo, TipoEvento.Error, mensaje);
        this.errores.mostrar(mensaje);
        return;
      }

      peliculaId = data[0].id;
    }

    const { error: errorGeneros } = await this.generoServicio.asignarAPelicula(peliculaId, [
      ...this.generosSeleccionados(),
    ]);

    if (errorGeneros) {
      this.logger.registrar(flujo, TipoEvento.Error, errorGeneros.message);
      this.errores.mostrar(errorGeneros.message);
      return;
    }

    this.logger.registrar(flujo, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/peliculas']);
  }

  cancelar() {
    this.router.navigate(['/admin/peliculas']);
  }

  private valoresParaGuardar(): PeliculaPorCrear {
    const valores = this.formulario.getRawValue();

    const omdb = this.omdb();
    const ratings = mapRatings(omdb?.Ratings);
    const datosOmdb = omdb
      ? {
          imdb_id: omdb.imdbID,
          omdb_data: omdb,
          rotten: ratings.rotten ?? null,
          metacritic: ratings.metacritic ?? null,
          imdb: ratings.imdb ?? null,
        }
      : {};

    return {
      ...datosOmdb,
      nombre: valores.nombre,
      sinopsis: valores.sinopsis || null,
      duracion_minutos: valores.duracion_minutos,
      imagen_url: valores.imagen_url || null,
      restriccion_edad: valores.restriccion_edad ? Number(valores.restriccion_edad) : null,
      activa: this.activa(),
      destacada: this.destacada(),
      en_proximamente: this.enProximamente(),
      avisar_notificaciones: this.avisarNotificaciones(),
      fecha_estreno: valores.fecha_estreno || null,
      trailer_url: valores.trailer_url || null,
      dias_preventa: valores.dias_preventa ? Number(valores.dias_preventa) : null,
      porcentaje_preventa: valores.porcentaje_preventa ? Number(valores.porcentaje_preventa) : null,
    };
  }
}
