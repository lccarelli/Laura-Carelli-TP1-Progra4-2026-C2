import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { Errores } from '../../../../servicios/errores/errores';
import { PeliculaPorCrear } from '../../../../interfaces/pelicula-por-crear';
import { Boton } from '../../../../componentes/boton/boton';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

@Component({
  imports: [ReactiveFormsModule, Boton],
  selector: 'app-formulario',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class Formulario {
  private peliculaServicio = inject(PeliculaServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logger = inject(Logger);

  protected id = signal<string | null>(null);
  protected activa = signal(true);
  protected imagenRota = signal(false);

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    sinopsis: [''],
    duracion_minutos: [0, [Validators.required, Validators.min(1)]],
    imagen_url: [''],
    restriccion_edad: [''],
  });

  protected imagenUrl = toSignal(this.formulario.controls.imagen_url.valueChanges, {
    initialValue: '',
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

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

  async cargar(id: string) {
    const { data, error } = await this.peliculaServicio.buscarPorId(id);

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
    });
    this.activa.set(data.activa);
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
    const id = this.id();
    const flujo = id ? Flujo.ModificacionPelicula : Flujo.AltaPelicula;

    const { error } = id
      ? await this.peliculaServicio.editar({ ...valores, id })
      : await this.peliculaServicio.crear(valores);

    if (error) {
      this.logger.registrar(flujo, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
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
    };
  }
}
