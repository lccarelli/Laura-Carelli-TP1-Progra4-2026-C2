import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../servicios/auth/auth';
import { Errores } from '../../servicios/errores/errores';
import { Router } from '@angular/router';
import { Boton } from '../../componentes/boton/boton';
import { environment } from '../../../environments/environment';

@Component({
  imports: [ReactiveFormsModule, Boton],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(Auth);
  private errores = inject(Errores);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);

  protected formulario = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async enviar() {
    const { email, password } = this.formulario.getRawValue();
    const { error } = await this.auth.loguear(email, password);

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      await this.router.navigate(['/admin']);
    }
  }

  async ingresarComoProfesor() {
    const { error } = await this.auth.loguear(
      environment.PROFESOR_EMAIL,
      environment.PROFESOR_PASSWORD,
    );

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      await this.router.navigate(['/admin']);
    }
  }
}
