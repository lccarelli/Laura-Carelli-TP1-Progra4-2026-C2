import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../servicios/auth/auth';
import { Boton } from '../boton/boton';
import { BotonLink } from '../boton-link/boton-link';

@Component({
  imports: [Boton, BotonLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  protected auth = inject(Auth);
  private router = inject(Router);

  async cerrarSesion() {
    await this.auth.cerrarSesion();
    await this.router.navigate(['/login']);
  }
}
