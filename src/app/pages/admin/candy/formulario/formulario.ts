import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private logger = inject(Logger);

  protected activo = signal(true);

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
    imagen_url: [''],
  });

  alternarActivo() {
    this.activo.update((valor) => !valor);
  }

  async guardar() {
    const valores = this.formulario.getRawValue();
    const { error } = await this.productoCandyServicio.crear({
      nombre: valores.nombre,
      precio: valores.precio,
      imagen_url: valores.imagen_url || null,
      activo: this.activo(),
    });

    if (error) {
      this.logger.registrar(Flujo.AltaCandy, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.AltaCandy, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/candy']);
  }

  cancelar() {
    this.router.navigate(['/admin/candy']);
  }
}
