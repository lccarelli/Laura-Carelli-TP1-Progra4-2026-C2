import { Component, inject, signal } from '@angular/core';
import { PremioServicio } from '../../../servicios/premio/premio';
import { Errores } from '../../../servicios/errores/errores';
import { Premio } from '../../../interfaces/premio';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { DiasValidosPipe } from '../../../pipes/dias-validos/dias-validos';

@Component({
  imports: [Boton, BotonLink],
  selector: 'app-premios',
  styleUrl: './premios.css',
  templateUrl: './premios.html',
})
export class Premios {
  private premioServicio = inject(PremioServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);
  private diasValidosPipe = new DiasValidosPipe();

  protected premios = signal<Premio[]>([]);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.premioServicio.listarTodas();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.premios.set(data ?? []);
    }
  }

  protected condicionesDe(premio: Premio): string {
    const dias = this.diasValidosPipe.transform(premio.dias_validos);
    return premio.cantidad_entradas ? `${dias} · ${premio.cantidad_entradas} entradas` : dias;
  }

  async eliminar(id: string) {
    const { error } = await this.premioServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaPremio, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaPremio, TipoEvento.Exito, id);
      await this.cargar();
    }
  }
}
