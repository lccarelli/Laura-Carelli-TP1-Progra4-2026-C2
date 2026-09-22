import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GeneroServicio } from '../../../../servicios/genero/genero';
import { Errores } from '../../../../servicios/errores/errores';
import { Boton } from '../../../../componentes/boton/boton';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

@Component({
  imports: [ReactiveFormsModule, Boton],
  selector: 'app-formulario-genero',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class FormularioGenero {
  private generoServicio = inject(GeneroServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private logger = inject(Logger);

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
  });

  async guardar() {
    const valores = this.formulario.getRawValue();
    const { error } = await this.generoServicio.crear(valores);

    if (error) {
      const mensaje = error.code === '23505' ? 'Ya existe un género con ese nombre' : error.message;

      this.logger.registrar(Flujo.AltaGenero, TipoEvento.Error, mensaje);
      this.errores.mostrar(mensaje);
      return;
    }

    this.logger.registrar(Flujo.AltaGenero, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/generos']);
  }

  cancelar() {
    this.router.navigate(['/admin/generos']);
  }
}
