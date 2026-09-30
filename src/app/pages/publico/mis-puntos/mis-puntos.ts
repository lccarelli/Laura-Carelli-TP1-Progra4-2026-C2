import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Auth } from '../../../servicios/auth/auth';
import { ClienteServicio } from '../../../servicios/cliente/cliente';
import { PremioServicio } from '../../../servicios/premio/premio';
import { CanjeServicio, CanjeConDetalle } from '../../../servicios/canje/canje';
import { Errores } from '../../../servicios/errores/errores';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { Cliente } from '../../../interfaces/cliente';
import { Premio } from '../../../interfaces/premio';
import { MovimientoCredito } from '../../../interfaces/movimiento-credito';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Boton } from '../../../componentes/boton/boton';
import { DiasValidosPipe } from '../../../pipes/dias-validos/dias-validos';

@Component({
  imports: [BotonLink, Boton, DatePipe, DiasValidosPipe],
  selector: 'app-mis-puntos',
  styleUrl: './mis-puntos.css',
  templateUrl: './mis-puntos.html',
})
export class MisPuntos {
  private auth = inject(Auth);
  private clienteServicio = inject(ClienteServicio);
  private premioServicio = inject(PremioServicio);
  private canjeServicio = inject(CanjeServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected cliente = signal<Cliente | null>(null);
  protected premios = signal<Premio[]>([]);
  protected canjes = signal<CanjeConDetalle[]>([]);
  protected canjeando = signal<string | null>(null);
  protected movimientosCredito = signal<MovimientoCredito[]>([]);

  constructor() {
    this.cargar();
  }

  async cargar() {
    const clienteId = this.auth.usuario()?.id;

    if (!clienteId) {
      return;
    }

    const { data: cliente, error: errorCliente } =
      await this.clienteServicio.obtenerOCrear(clienteId);

    if (errorCliente || !cliente) {
      this.errores.mostrar(errorCliente?.message ?? 'No se encontró tu perfil');
      return;
    }

    this.cliente.set(cliente);

    const [
      { data: premios, error: errorPremios },
      { data: canjes, error: errorCanjes },
      { data: movimientos, error: errorMovimientos },
    ] = await Promise.all([
      this.premioServicio.listarActivas(),
      this.canjeServicio.listarPorCliente(clienteId),
      this.clienteServicio.listarMovimientosCredito(clienteId),
    ]);

    if (errorPremios) {
      this.errores.mostrar(errorPremios.message);
    } else {
      this.premios.set(premios ?? []);
    }

    if (errorCanjes) {
      this.errores.mostrar(errorCanjes.message);
    } else {
      this.canjes.set(canjes ?? []);
    }

    if (errorMovimientos) {
      this.errores.mostrar(errorMovimientos.message);
    } else {
      this.movimientosCredito.set(movimientos ?? []);
    }
  }

  protected alcanzaSaldo(costoPuntos: number): boolean {
    return (this.cliente()?.puntos ?? 0) >= costoPuntos;
  }

  async canjear(premio: Premio) {
    if (this.canjeando()) {
      return;
    }

    this.canjeando.set(premio.id);
    const { error } = await this.canjeServicio.canjear(premio.id);
    this.canjeando.set(null);

    if (error) {
      this.logger.registrar(Flujo.CanjePuntos, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.CanjePuntos, TipoEvento.Exito, premio.nombre);
    await this.cargar();
  }
}
