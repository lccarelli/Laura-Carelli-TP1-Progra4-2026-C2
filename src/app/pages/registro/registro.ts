import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../servicios/auth/auth';
import { Errores } from '../../servicios/errores/errores';
import { Boton } from '../../componentes/boton/boton';
import { BotonLink } from '../../componentes/boton-link/boton-link';
import { Logger } from '../../servicios/logger/logger';
import { Flujo } from '../../servicios/logger/flujo';
import { TipoEvento } from '../../servicios/logger/tipo-evento';

@Component({
  imports: [ReactiveFormsModule, Boton, BotonLink],
  selector: 'app-registro',
  styleUrl: './registro.css',
  templateUrl: './registro.html',
})
export class Registro {
  private auth = inject(Auth);
  private errores = inject(Errores);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private logger = inject(Logger);

  protected registrado = signal(false);
  protected tiposDeSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  protected formulario = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', Validators.required],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    fecha_nacimiento: ['', Validators.required],
    tipo_sangre: ['', Validators.required],
    color_ojos: ['', Validators.required],
    dias_vacaciones: [0, [Validators.required, Validators.min(0)]],
  });

  async enviar() {
    const valores = this.formulario.getRawValue();

    if (valores.password !== valores.confirmarPassword) {
      this.errores.mostrar('Las contraseñas no coinciden');
      return;
    }

    const { data, error } = await this.auth.registrarCliente(valores);

    if (error) {
      this.logger.registrar(Flujo.AltaUsuario, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.AltaUsuario, TipoEvento.Exito, valores.email);

    if (data.session) {
      await this.router.navigate(['/peliculas']);
    } else {
      this.registrado.set(true);
    }
  }
}
