import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { Errores } from '../../../../servicios/errores/errores';
import { PeliculaPorCrear } from '../../../../interfaces/pelicula-por-crear';
import { Boton } from '../../../../componentes/boton/boton';

@Component({
  imports: [ReactiveFormsModule, Boton],
  selector: 'app-formulario',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class Formulario {
  private peliculaS = inject(PeliculaServicio);
  private errores = inject(Errores);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected id = signal<string | null>(null);
  protected activa = signal(true);
  protected imagenRota = signal(false);

  protected formulario = this.fb.nonNullable.group({
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
    const { data, error } = await this.peliculaS.buscarPorId(id);

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
    const { error } = await this.peliculaS.cambiarEstado(id, nuevoEstado);

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.activa.set(nuevoEstado);
    }
  }

  async eliminarPelicula() {
    const id = this.id();
    if (!id) return;

    const { error } = await this.peliculaS.eliminar(id);

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      await this.router.navigate(['/admin/peliculas']);
    }
  }

  async guardar() {
    const valores = this.valoresParaGuardar();
    const id = this.id();

    const { error } = id
      ? await this.peliculaS.editar({ ...valores, id })
      : await this.peliculaS.crear(valores);

    if (error) {
      this.errores.mostrar(error.message);
      return;
    }

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
