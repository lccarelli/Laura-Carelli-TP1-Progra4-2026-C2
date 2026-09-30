import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toDataURL } from 'qrcode';
import { CompraConDetalle, CompraServicio } from '../../../servicios/compra/compra';
import { ClienteServicio } from '../../../servicios/cliente/cliente';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { Boton } from '../../../componentes/boton/boton';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

const MS_VENTANA_CANCELACION = 2 * 60 * 60 * 1000;

@Component({
  imports: [BotonLink, Boton, DatePipe],
  selector: 'app-mis-compras',
  styleUrl: './mis-compras.css',
  templateUrl: './mis-compras.html',
})
export class MisCompras {
  private compraServicio = inject(CompraServicio);
  private clienteServicio = inject(ClienteServicio);
  private auth = inject(Auth);
  private errores = inject(Errores);
  private logger = inject(Logger);
  protected cancelando = signal<string | null>(null);

  protected compras = signal<CompraConDetalle[]>([]);
  protected qrPorCompra = signal<Map<string, string>>(new Map());

  constructor() {
    this.cargar();
  }

  async cargar() {
    const clienteId = this.auth.usuario()?.id;

    if (!clienteId) {
      return;
    }

    const { data, error } = await this.compraServicio.listarPorCliente(clienteId);

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.compras.set(data ?? []);
    }
  }

  protected qrDe(codigoCompra: string): string | null {
    return this.qrPorCompra().get(codigoCompra) ?? null;
  }

  protected puedeCancelar(compra: CompraConDetalle): boolean {
    if (compra.cancelada_en || !compra.funcion) {
      return false;
    }

    const inicio = new Date(compra.funcion.inicio).getTime();
    return inicio - Date.now() > MS_VENTANA_CANCELACION;
  }

  async cancelar(compra: CompraConDetalle) {
    if (this.cancelando()) {
      return;
    }

    this.cancelando.set(compra.codigo_compra);
    const { error } = await this.clienteServicio.cancelarCompra(compra.codigo_compra);
    this.cancelando.set(null);

    if (error) {
      this.logger.registrar(Flujo.CancelacionCompra, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.CancelacionCompra, TipoEvento.Exito, compra.codigo_compra);
    await this.cargar();
  }

  async verQr(codigoCompra: string) {
    if (this.qrPorCompra().has(codigoCompra)) {
      const mapa = new Map(this.qrPorCompra());
      mapa.delete(codigoCompra);
      this.qrPorCompra.set(mapa);
      return;
    }

    const dataUrl = await toDataURL(codigoCompra);
    const mapa = new Map(this.qrPorCompra());
    mapa.set(codigoCompra, dataUrl);
    this.qrPorCompra.set(mapa);
  }
}
