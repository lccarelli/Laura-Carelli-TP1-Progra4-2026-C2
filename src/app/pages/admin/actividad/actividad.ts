import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LogActividadServicio } from '../../../servicios/log-actividad/log-actividad';
import { Errores } from '../../../servicios/errores/errores';
import { LogActividad } from '../../../interfaces/log-actividad';
import { BotonLink } from '../../../componentes/boton-link/boton-link';

@Component({
  imports: [BotonLink, DatePipe],
  selector: 'app-actividad',
  styleUrl: './actividad.css',
  templateUrl: './actividad.html',
})
export class Actividad {
  private logActividadServicio = inject(LogActividadServicio);
  private errores = inject(Errores);

  protected registros = signal<LogActividad[]>([]);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.logActividadServicio.listar();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.registros.set(data ?? []);
    }
  }
}
