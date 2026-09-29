import { Component, inject, signal } from '@angular/core';
import { Auth } from '../../servicios/auth/auth';
import { ConfiguracionCuponServicio } from '../../servicios/configuracion-cupon/configuracion-cupon';
import { ConfiguracionCupon } from '../../interfaces/configuracion-cupon';
import { Boton } from '../boton/boton';
import { BotonLink } from '../boton-link/boton-link';

const CLAVE_CERRADO = 'aviso-cupon-bienvenida-cerrado';

@Component({
  imports: [Boton, BotonLink],
  selector: 'app-aviso-cupon-bienvenida',
  styleUrl: './aviso-cupon-bienvenida.css',
  templateUrl: './aviso-cupon-bienvenida.html',
})
export class AvisoCuponBienvenida {
  protected auth = inject(Auth);
  private configuracionCuponServicio = inject(ConfiguracionCuponServicio);

  protected config = signal<ConfiguracionCupon | null>(null);
  protected cerrado = signal(this.estabaCerrado());

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data } = await this.configuracionCuponServicio.obtener();
    this.config.set(data ?? null);
  }

  private estabaCerrado(): boolean {
    try {
      return sessionStorage.getItem(CLAVE_CERRADO) === 'true';
    } catch {
      return false;
    }
  }

  cerrar() {
    this.cerrado.set(true);

    try {
      sessionStorage.setItem(CLAVE_CERRADO, 'true');
    } catch {
      // Sin acceso a sessionStorage (ej. navegación privada): sólo se cierra por esta vista.
    }
  }
}
