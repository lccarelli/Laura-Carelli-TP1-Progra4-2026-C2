import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoCandyServicio } from '../../../../servicios/producto-candy/producto-candy';
import { Errores } from '../../../../servicios/errores/errores';
import { Boton } from '../../../../componentes/boton/boton';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

@Component({
  imports: [ReactiveFormsModule, Boton],
  selector: 'app-formulario-candy',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class FormularioCandy {
  private productoCandyServicio = inject(ProductoCandyServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logger = inject(Logger);

  protected id = signal<string | null>(null);
  protected activo = signal(true);
  protected imagenRota = signal(false);

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
    imagen_url: [''],
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
    const { data, error } = await this.productoCandyServicio.buscarPorId(id);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró el producto');
      return;
    }

    this.formulario.setValue({
      nombre: data.nombre,
      precio: data.precio,
      imagen_url: data.imagen_url ?? '',
    });
    this.activo.set(data.activo);
  }

  alternarActivo() {
    this.activo.update((valor) => !valor);
  }

  async guardar() {
    const valores = this.formulario.getRawValue();
    const idExistente = this.id();
    const flujo = idExistente ? Flujo.ModificacionCandy : Flujo.AltaCandy;

    const datos = {
      nombre: valores.nombre,
      precio: valores.precio,
      imagen_url: valores.imagen_url || null,
      activo: this.activo(),
    };

    const { error } = idExistente
      ? await this.productoCandyServicio.editar({ ...datos, id: idExistente })
      : await this.productoCandyServicio.crear(datos);

    if (error) {
      this.logger.registrar(flujo, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(flujo, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/candy']);
  }

  cancelar() {
    this.router.navigate(['/admin/candy']);
  }

  async eliminarProducto() {
    const id = this.id();
    if (!id) return;

    const { error } = await this.productoCandyServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaCandy, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaCandy, TipoEvento.Exito, id);
      await this.router.navigate(['/admin/candy']);
    }
  }
}
