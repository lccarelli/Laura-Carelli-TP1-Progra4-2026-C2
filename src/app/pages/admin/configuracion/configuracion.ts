import { Component, inject, signal } from '@angular/core';
import { ConfiguracionHomeServicio } from '../../../servicios/configuracion-home/configuracion-home';
import { ConfiguracionCuponServicio } from '../../../servicios/configuracion-cupon/configuracion-cupon';
import { Errores } from '../../../servicios/errores/errores';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Boton } from '../../../componentes/boton/boton';
import { ConfiguracionHome } from '../../../interfaces/configuracion-home';

@Component({
  imports: [BotonLink, Boton],
  selector: 'app-configuracion',
  styleUrl: './configuracion.css',
  templateUrl: './configuracion.html',
})
export class Configuracion {
  private configuracionHomeServicio = inject(ConfiguracionHomeServicio);
  private configuracionCuponServicio = inject(ConfiguracionCuponServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected modo = signal<ConfiguracionHome['modo_destacadas']>('automatico');
  protected porcentajeCupon = signal(20);
  protected edadMinimaCupon = signal<number | null>(null);

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

    const { data: cupon, error: errorCupon } = await this.configuracionCuponServicio.obtener();

    if (errorCupon || !cupon) {
      this.errores.mostrar(errorCupon?.message ?? 'No se encontró la configuración del cupón');
      return;
    }

    this.porcentajeCupon.set(cupon.porcentaje);
    this.edadMinimaCupon.set(cupon.edad_minima);
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

  actualizarPorcentajeCupon(valor: string) {
    const numero = Number(valor);
    this.porcentajeCupon.set(Number.isFinite(numero) ? numero : 0);
  }

  actualizarEdadMinimaCupon(valor: string) {
    const numero = Number(valor);
    this.edadMinimaCupon.set(valor.trim() !== '' && Number.isFinite(numero) ? numero : null);
  }

  async guardarCupon() {
    const { error } = await this.configuracionCuponServicio.actualizar(
      this.porcentajeCupon(),
      this.edadMinimaCupon(),
    );

    if (error) {
      this.logger.registrar(Flujo.ModificacionConfiguracionCupon, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(
      Flujo.ModificacionConfiguracionCupon,
      TipoEvento.Exito,
      `${this.porcentajeCupon()}% / edad mínima ${this.edadMinimaCupon() ?? 'sin restricción'}`,
    );
  }
}
