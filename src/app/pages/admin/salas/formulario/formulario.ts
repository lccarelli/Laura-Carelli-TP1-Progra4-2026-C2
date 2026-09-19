import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SalaServicio } from '../../../../servicios/sala/sala';
import { Errores } from '../../../../servicios/errores/errores';
import { Boton } from '../../../../componentes/boton/boton';

@Component({
  imports: [ReactiveFormsModule, Boton],
  selector: 'app-formulario-sala',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class FormularioSala {
  private salaServicio = inject(SalaServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
  });

  async guardar() {
    const { error } = await this.salaServicio.crear(this.formulario.getRawValue());

    if (error) {
      this.errores.mostrar(error.message);
      return;
    }

    await this.router.navigate(['/admin/salas']);
  }

  cancelar() {
    this.router.navigate(['/admin/salas']);
  }
}
