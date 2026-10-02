import { Component, OnDestroy, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { CompraServicio, CompraParaValidar } from '../../../servicios/compra/compra';
import { EntradaServicio, ButacaDeEntrada } from '../../../servicios/entrada/entrada';
import {
  CompraCandyServicio,
  ItemCandyDeCompra,
} from '../../../servicios/compra-candy/compra-candy';
import { Boton } from '../../../componentes/boton/boton';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

const ID_LECTOR = 'lector-qr';

@Component({
  imports: [Boton, DatePipe],
  selector: 'app-boleteria',
  styleUrl: './boleteria.css',
  templateUrl: './boleteria.html',
})
export class Boleteria implements OnDestroy {
  private compraServicio = inject(CompraServicio);
  private entradaServicio = inject(EntradaServicio);
  private compraCandyServicio = inject(CompraCandyServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);
  private auth = inject(Auth);

  protected readonly idLector = ID_LECTOR;

  protected codigo = signal('');
  protected buscando = signal(false);
  protected validando = signal(false);
  protected noEncontrada = signal(false);
  protected escaneando = signal(false);
  protected validacionExitosa = signal(false);
  protected compra = signal<CompraParaValidar | null>(null);
  protected butacas = signal<ButacaDeEntrada[]>([]);
  protected candy = signal<ItemCandyDeCompra[]>([]);

  private lector: Html5Qrcode | null = null;

  actualizarCodigo(valor: string) {
    this.codigo.set(valor);
  }

  async buscar() {
    const codigo = this.codigo().trim();

    if (!codigo || this.buscando()) {
      return;
    }

    this.buscando.set(true);
    this.compra.set(null);
    this.noEncontrada.set(false);
    this.validacionExitosa.set(false);

    const { data, error } = await this.compraServicio.buscarPorCodigo(codigo);

    if (error || !data) {
      this.noEncontrada.set(true);
      this.buscando.set(false);
      return;
    }

    const [{ data: butacas }, { data: candy }] = await Promise.all([
      this.entradaServicio.listarPorCodigoCompra(codigo),
      this.compraCandyServicio.listarPorCodigo(codigo),
    ]);

    this.compra.set(data);
    this.butacas.set(butacas ?? []);
    this.candy.set(candy ?? []);
    this.buscando.set(false);
  }

  async confirmarIngreso() {
    const compra = this.compra();
    const empleadoId = this.auth.usuario()?.id;

    if (!compra || !empleadoId || this.validando()) {
      return;
    }

    this.validando.set(true);
    const { error } = await this.compraServicio.validar(compra.codigo_compra, empleadoId);
    this.validando.set(false);

    if (error) {
      this.logger.registrar(Flujo.ValidacionQr, TipoEvento.Error, error);
      this.errores.mostrar(error);
      return;
    }

    this.logger.registrar(Flujo.ValidacionQr, TipoEvento.Exito, compra.codigo_compra);
    this.validacionExitosa.set(true);
    this.compra.set({ ...compra, validada_en: new Date().toISOString() });
  }

  async alternarEscaner() {
    if (this.escaneando()) {
      await this.detenerEscaner();
      return;
    }

    this.escaneando.set(true);

    // el div del lector recién queda visible tras este cambio de signal: hay que
    // esperar un frame para que tenga tamaño antes de arrancar la cámara sobre él
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    this.lector = new Html5Qrcode(ID_LECTOR);

    try {
      await this.lector.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (textoDecodificado) => {
          this.codigo.set(textoDecodificado);
          await this.detenerEscaner();
          await this.buscar();
        },
        undefined,
      );
    } catch {
      this.errores.mostrar('No se pudo acceder a la cámara.');
      this.escaneando.set(false);
    }
  }

  private async detenerEscaner() {
    if (this.lector?.isScanning) {
      await this.lector.stop();
    }

    this.lector = null;
    this.escaneando.set(false);
  }

  ngOnDestroy() {
    if (this.lector?.isScanning) {
      this.lector.stop();
    }
  }
}
