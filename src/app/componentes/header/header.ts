import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { Auth } from '../../servicios/auth/auth';
import { PushServicio } from '../../servicios/push/push';
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
  protected menuAbierto = signal(false);
  // se inyecta sin usarlo para activar su escucha global de clicks en notificaciones
  private push = inject(PushServicio);
  protected router = inject(Router);
  private errores = inject(Errores);
  private logger = inject(Logger);

  alternarMenu() {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu() {
    this.menuAbierto.set(false);
  }

  constructor() {
    // Cierra el menú mobile cuando termina de navegar, sea por click en un
    // link o por teclado — más confiable que escuchar el click en sí.
    this.router.events
      .pipe(filter((evento) => evento instanceof NavigationEnd))
      .subscribe(() => this.cerrarMenu());
  }

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
