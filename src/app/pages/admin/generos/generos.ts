import { Component, computed, inject, signal } from '@angular/core';
import { GeneroServicio } from '../../../servicios/genero/genero';
import { Errores } from '../../../servicios/errores/errores';
import { Genero } from '../../../interfaces/genero';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

@Component({
  imports: [Boton, BotonLink],
  selector: 'app-generos',
  styleUrl: './generos.css',
  templateUrl: './generos.html',
})
export class Generos {
  private generoServicio = inject(GeneroServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected generos = signal<Genero[]>([]);
  protected busqueda = signal('');

  protected generosFiltrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();

    if (!texto) {
      return this.generos();
    }

    return this.generos().filter((genero) => genero.nombre.toLowerCase().includes(texto));
  });

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.generoServicio.listar();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.generos.set(data ?? []);
    }
  }

  buscar(texto: string) {
    this.busqueda.set(texto);
  }

  async eliminar(id: string) {
    const { error } = await this.generoServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaGenero, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaGenero, TipoEvento.Exito, id);
      await this.cargar();
    }
  }
}
