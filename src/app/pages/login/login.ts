import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../servicios/auth/auth';
import { Errores } from '../../servicios/errores/errores';
import { Router } from '@angular/router';
import { Boton } from '../../componentes/boton/boton';
import { BotonLink } from '../../componentes/boton-link/boton-link';
import { Logger } from '../../servicios/logger/logger';
import { Flujo } from '../../servicios/logger/flujo';
import { TipoEvento } from '../../servicios/logger/tipo-evento';

@Component({
  imports: [ReactiveFormsModule, Boton, BotonLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(Auth);
  private errores = inject(Errores);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private logger = inject(Logger);

  protected formulario = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async enviar() {
    const { email, password } = this.formulario.getRawValue();
    const { data, error } = await this.auth.loguear(email, password);

    if (error) {
      this.logger.registrar(Flujo.Login, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.Login, TipoEvento.Exito, email);
      const rol = data.user?.user_metadata?.['role'];
      const destino = rol === 'admin' ? '/admin' : rol === 'empleado' ? '/boleteria' : '/peliculas';
      await this.router.navigate([destino]);
    }
  }
}
