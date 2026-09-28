import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../servicios/auth/auth';
import { Errores } from '../../servicios/errores/errores';
import { Boton } from '../boton/boton';
import { BotonLink } from '../boton-link/boton-link';
import { environment } from '../../../environments/environment';
import { Logger } from '../../servicios/logger/logger';
import { Flujo } from '../../servicios/logger/flujo';
import { TipoEvento } from '../../servicios/logger/tipo-evento';

@Component({
  imports: [Boton, BotonLink, RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected auth = inject(Auth);
  private router = inject(Router);
  private errores = inject(Errores);
  private logger = inject(Logger);

  async cerrarSesion() {
    const email = this.auth.usuario()?.email;

    await this.auth.cerrarSesion();
    this.logger.registrar(Flujo.CerrarSesion, TipoEvento.Exito, email);
    await this.router.navigate(['/']);
  }

  async ingresarComoProfesor() {
    const { error } = await this.auth.loguear(
      environment.PROFESOR_EMAIL,
      environment.PROFESOR_PASSWORD,
    );

    if (error) {
      this.logger.registrar(Flujo.Login, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.Login, TipoEvento.Exito, 'acceso directo profesor');
      await this.router.navigate(['/admin']);
    }
  }
}
