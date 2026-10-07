import { DatePipe } from '@angular/common';
import { inject, Service } from '@angular/core';
import { toDataURL } from 'qrcode';
import { Butaca } from '../../interfaces/butaca';
import { Funcion } from '../../interfaces/funcion';
import { Pelicula } from '../../interfaces/pelicula';
import { Premio } from '../../interfaces/premio';
import { ProductoCandy } from '../../interfaces/producto-candy';
import { RestriccionEdadPipe } from '../../pipes/restriccion-edad/restriccion-edad';
import { formatearCodigo } from '../../utilidades/codigo-compra';
import { calcularTotalAPagar } from '../../utilidades/precios';
import { EntradaServicio } from '../entrada/entrada';
import { CompraServicio } from '../compra/compra';
import { Combo } from '../../interfaces/combo';
import { Errores } from '../errores/errores';
import { Flujo } from '../logger/flujo';
import { Logger } from '../logger/logger';
import { TipoEvento } from '../logger/tipo-evento';

const FORMATO_DIA_HORA = 'EEEE dd/MM/yyyy HH:mm';

export interface PedidoCompra {
  codigo: string;
  funcion: Funcion;
  pelicula: Pelicula | null;
  sala: string;
  butacas: Butaca[];
  candy: { producto: ProductoCandy; cantidad: number }[];
  combos: { combo: Combo; cantidad: number }[];
  total: number;
  descuentoCupon: number;
  premio: Premio | null;
  credito: number;
  usuarioId: string | null;
  email: string;
  edadDeclarada: number | null;
}

export interface ResultadoCompra {
  qr: string;
  descuentoCupon: number;
  credito: number;
  mailEnviado: boolean;
}

function quitarPrefijoBase64(dataUrl: string): string {
  const indice = dataUrl.indexOf(',');
  return indice === -1 ? dataUrl : dataUrl.slice(indice + 1);
}

@Service()
export class ProcesoCompra {
  private compraServicio = inject(CompraServicio);
  private entradaServicio = inject(EntradaServicio);
  private datePipe = inject(DatePipe);
  private errores = inject(Errores);
  private logger = inject(Logger);

  async completar(pedido: PedidoCompra): Promise<ResultadoCompra | null> {
    const total = calcularTotalAPagar(
      pedido.total,
      pedido.descuentoCupon + (pedido.premio?.monto_descuento ?? 0),
      pedido.credito,
    );

    if (!(await this.confirmar(pedido, total))) {
      return null;
    }

    const qr = await toDataURL(pedido.codigo);
    const mailEnviado = await this.enviarMail(pedido, qr, total);
    await this.avisarPorPush(pedido);

    this.logger.registrar(Flujo.AltaCompra, TipoEvento.Exito, pedido.codigo);

    return {
      qr,
      descuentoCupon: pedido.descuentoCupon,
      credito: pedido.credito,
      mailEnviado,
    };
  }

  private async confirmar(pedido: PedidoCompra, total: number): Promise<boolean> {
    const { error } = await this.compraServicio.confirmar({
      codigo: pedido.codigo,
      funcionId: pedido.funcion.id,
      butacaIds: pedido.butacas.map((butaca) => butaca.id),
      sesionId: this.entradaServicio.sesionId(),
      email: pedido.email,
      edadDeclarada: pedido.edadDeclarada,
      total,
      descuentoCupon: pedido.descuentoCupon,
      premioId: pedido.premio?.id ?? null,
      credito: pedido.credito,
      candy: pedido.candy.map((item) => ({
        producto_candy_id: item.producto.id,
        cantidad: item.cantidad,
      })),
      combos: pedido.combos.map((item) => ({ combo_id: item.combo.id, cantidad: item.cantidad })),
    });

    if (error) {
      this.logger.registrar(Flujo.AltaCompra, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return false;
    }

    return true;
  }

  private async enviarMail(pedido: PedidoCompra, qr: string, total: number): Promise<boolean> {
    const { funcion, pelicula } = pedido;
    const { error } = await this.compraServicio.enviarQrPorMail({
      email: pedido.email,
      codigoCompra: formatearCodigo(pedido.codigo),
      qrBase64: quitarPrefijoBase64(qr),
      posterUrl: pelicula?.imagen_url ?? null,
      peliculaNombre: pelicula?.nombre ?? '',
      restriccionTexto: new RestriccionEdadPipe().transform(pelicula?.restriccion_edad ?? null),
      sala: pedido.sala,
      diaHora: this.datePipe.transform(funcion.inicio, FORMATO_DIA_HORA) ?? '',
      formato: funcion.formato,
      idioma: funcion.idioma,
      butacasTexto: pedido.butacas.map((b) => `${b.fila}${b.numero} (${b.tipo})`),
      candyTexto: pedido.candy.map((item) => `${item.cantidad}x ${item.producto.nombre}`),
      combosTexto: pedido.combos.map((item) => `${item.cantidad}x ${item.combo.nombre}`),
      total,
      descuentoCupon: pedido.descuentoCupon,
    });

    return !error;
  }

  private async avisarPorPush(pedido: PedidoCompra) {
    if (!pedido.usuarioId) {
      return;
    }

    try {
      const { error } = await this.compraServicio.enviarPushCompraConfirmada(
        pedido.usuarioId,
        pedido.pelicula?.nombre ?? '',
        pedido.codigo,
      );

      if (error) {
        this.logger.registrar(Flujo.AvisoPushCompra, TipoEvento.Error, error.message);
      }
    } catch (error) {
      // best-effort: si falla el push no queremos romper la confirmación de la compra
      this.logger.registrar(Flujo.AvisoPushCompra, TipoEvento.Error, String(error));
    }
  }
}
