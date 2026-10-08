import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Errores } from '../../../servicios/errores/errores';
import { CompraServicio, CompraParaValidar } from '../../../servicios/compra/compra';
import { CompraCandyServicio } from '../../../servicios/compra-candy/compra-candy';
import { CompraComboServicio } from '../../../servicios/compra-combo/compra-combo';
import { AvisoUso } from '../../../componentes/aviso-uso/aviso-uso';
import { LectorCodigo } from '../../../componentes/lector-codigo/lector-codigo';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

type EstadoCandy = 'habilitado' | 'usado';

interface ProductoAEntregar {
  tipo: 'candy' | 'combo';
  id: string;
  nombre: string;
  cantidad: number;
  cantidadEntregada: number;
}

@Component({
  imports: [AvisoUso, DatePipe, LectorCodigo],
  selector: 'app-entrega-candy',
  styleUrl: '../boleteria/boleteria.css',
  templateUrl: './entrega-candy.html',
})
export class EntregaCandy {
  private compraServicio = inject(CompraServicio);
  private compraCandyServicio = inject(CompraCandyServicio);
  private compraComboServicio = inject(CompraComboServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected buscando = signal(false);
  protected entregando = signal(false);
  protected compraNoEncontrada = signal(false);
  protected compra = signal<CompraParaValidar | null>(null);
  protected productos = signal<ProductoAEntregar[]>([]);
  protected estado = signal<EstadoCandy | null>(null);

  protected productosPendientes = computed(() =>
    this.productos().filter((producto) => producto.cantidadEntregada < producto.cantidad),
  );

  async buscar(codigo: string) {
    if (this.buscando() || this.entregando()) {
      return;
    }

    this.buscando.set(true);
    this.compra.set(null);
    this.compraNoEncontrada.set(false);
    this.estado.set(null);

    const { data, error } = await this.compraServicio.buscarPorCodigo(codigo);

    if (error || !data) {
      this.compraNoEncontrada.set(true);
      this.buscando.set(false);
      return;
    }

    const cargados = await this.cargarProductos(codigo);
    this.buscando.set(false);

    if (!cargados) {
      return;
    }

    this.compra.set(data);

    if (data.cancelada_en || this.productos().length === 0) {
      return;
    }

    if (this.productosPendientes().length === 0) {
      this.estado.set('usado');
      return;
    }

    await this.entregarPendientes(codigo);
  }

  private async cargarProductos(codigo: string) {
    const [{ data: candy, error: errorCandy }, { data: combos, error: errorCombos }] =
      await Promise.all([
        this.compraCandyServicio.listarPorCodigo(codigo),
        this.compraComboServicio.listarPorCodigo(codigo),
      ]);
    const error = errorCandy ?? errorCombos;

    if (error) {
      this.logger.registrar(Flujo.EntregaCandy, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return false;
    }

    this.productos.set([
      ...(candy ?? []).map((fila) => ({
        tipo: 'candy' as const,
        id: fila.id,
        nombre: fila.producto_candy?.nombre ?? '—',
        cantidad: fila.cantidad,
        cantidadEntregada: fila.cantidad_entregada,
      })),
      ...(combos ?? []).map((fila) => ({
        tipo: 'combo' as const,
        id: fila.id,
        nombre: fila.combo?.nombre ?? '—',
        cantidad: fila.cantidad,
        cantidadEntregada: fila.cantidad_entregada,
      })),
    ]);

    return true;
  }

  private async entregarPendientes(codigo: string) {
    this.entregando.set(true);
    const { error } = await this.compraCandyServicio.entregarPendientes(codigo);
    this.entregando.set(false);

    if (error) {
      this.logger.registrar(Flujo.EntregaCandy, TipoEvento.Error, error.message);
      await this.cargarProductos(codigo);

      if (this.productosPendientes().length === 0) {
        this.estado.set('usado');
      } else {
        this.errores.mostrar(error.message);
      }

      return;
    }

    this.logger.registrar(Flujo.EntregaCandy, TipoEvento.Exito, codigo);

    this.productos.update((productos) =>
      productos.map((producto) => ({ ...producto, cantidadEntregada: producto.cantidad })),
    );
    this.estado.set('habilitado');

    await this.avisarPorPush(codigo);
  }

  private async avisarPorPush(codigo: string) {
    try {
      const { error } = await this.compraServicio.enviarPushDeUso(codigo, 'candy');

      if (error) {
        this.logger.registrar(Flujo.AvisoPushUso, TipoEvento.Error, error.message);
      }
    } catch (error) {
      // best-effort: si falla el push no queremos deshacer la entrega ya registrada
      this.logger.registrar(Flujo.AvisoPushUso, TipoEvento.Error, String(error));
    }
  }
}
