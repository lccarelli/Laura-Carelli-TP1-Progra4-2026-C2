import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toDataURL } from 'qrcode';
import { CompraConDetalle, CompraServicio } from '../../../servicios/compra/compra';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { BotonLink } from '../../../componentes/boton-link/boton-link';

@Component({
  imports: [BotonLink, DatePipe],
  selector: 'app-mis-compras',
  styleUrl: './mis-compras.css',
  templateUrl: './mis-compras.html',
})
export class MisCompras {
  private compraServicio = inject(CompraServicio);
  private auth = inject(Auth);
  private errores = inject(Errores);

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
