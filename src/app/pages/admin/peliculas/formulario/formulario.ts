import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { GeneroServicio } from '../../../../servicios/genero/genero';
import { Errores } from '../../../../servicios/errores/errores';
import { PeliculaPorCrear } from '../../../../interfaces/pelicula-por-crear';
import { Genero } from '../../../../interfaces/genero';
import { Boton } from '../../../../componentes/boton/boton';
import { EstadoPunto } from '../../../../componentes/estado-punto/estado-punto';
import { SelectorChips } from '../../../../componentes/selector-chips/selector-chips';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

@Component({
  imports: [ReactiveFormsModule, Boton, EstadoPunto, SelectorChips],
  selector: 'app-formulario',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class Formulario {
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
  protected imagenRota = signal(false);
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
  });

  protected imagenUrl = toSignal(this.formulario.controls.imagen_url.valueChanges, {
    initialValue: '',
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    this.cargarGeneros();

    if (id) {
      this.id.set(id);
      this.cargar(id);
    }

    effect(() => {
      this.imagenUrl();
      this.imagenRota.set(false);
    });
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
    });
    this.activa.set(data.activa);
    this.destacada.set(data.destacada);
    this.generosSeleccionados.set(new Set((generosDePelicula ?? []).map((g) => g.id)));
  }

  alternarDestacada() {
    this.destacada.update((valor) => !valor);
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

    return {
      nombre: valores.nombre,
      sinopsis: valores.sinopsis || null,
      duracion_minutos: valores.duracion_minutos,
      imagen_url: valores.imagen_url || null,
      restriccion_edad: valores.restriccion_edad ? Number(valores.restriccion_edad) : null,
      activa: this.activa(),
      destacada: this.destacada(),
      fecha_estreno: valores.fecha_estreno || null,
    };
  }
}
