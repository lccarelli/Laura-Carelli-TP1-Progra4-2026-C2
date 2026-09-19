import { Component, inject, signal } from '@angular/core';
import { SalaServicio } from '../../../servicios/sala/sala';
import { Errores } from '../../../servicios/errores/errores';
import { Sala } from '../../../interfaces/sala';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';

@Component({
  imports: [Boton, BotonLink],
  selector: 'app-salas',
  styleUrl: './salas.css',
  templateUrl: './salas.html',
})
export class Salas {
  private salaServicio = inject(SalaServicio);
  private errores = inject(Errores);

  protected salas = signal<Sala[]>([]);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.salaServicio.listar();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.salas.set(data ?? []);
    }
  }

  async eliminar(id: string) {
    const { error } = await this.salaServicio.eliminar(id);

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      await this.cargar();
    }
  }
}
