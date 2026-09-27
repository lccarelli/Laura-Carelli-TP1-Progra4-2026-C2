import { Component, inject, signal } from '@angular/core';
import { ConfiguracionHomeServicio } from '../../../servicios/configuracion-home/configuracion-home';
import { Errores } from '../../../servicios/errores/errores';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { ConfiguracionHome } from '../../../interfaces/configuracion-home';

@Component({
  imports: [BotonLink],
  selector: 'app-configuracion',
  styleUrl: './configuracion.css',
  templateUrl: './configuracion.html',
})
export class Configuracion {
  private configuracionHomeServicio = inject(ConfiguracionHomeServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected modo = signal<ConfiguracionHome['modo_destacadas']>('automatico');

  constructor() {
    this.cargar();
  }

  async cargar() {
    const { data, error } = await this.configuracionHomeServicio.obtener();

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró la configuración');
      return;
    }

    this.modo.set(data.modo_destacadas);
  }

  async elegirModo(modo: ConfiguracionHome['modo_destacadas']) {
    if (modo === this.modo()) {
      return;
    }

    const { error } = await this.configuracionHomeServicio.actualizarModo(modo);

    if (error) {
      this.logger.registrar(Flujo.ModificacionConfiguracionHome, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.ModificacionConfiguracionHome, TipoEvento.Exito, modo);
    this.modo.set(modo);
  }
}
