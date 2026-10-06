import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Errores } from '../../../servicios/errores/errores';
import { CompraServicio, CompraParaValidar } from '../../../servicios/compra/compra';
import { CompraCandyServicio } from '../../../servicios/compra-candy/compra-candy';
import { CompraComboServicio } from '../../../servicios/compra-combo/compra-combo';
import { Boton } from '../../../componentes/boton/boton';
import { LectorCodigo } from '../../../componentes/lector-codigo/lector-codigo';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

interface ItemEntrega {
  tipo: 'candy' | 'combo';
  id: string;
  nombre: string;
  cantidad: number;
  entregada: number;
}

@Component({
  imports: [Boton, DatePipe, LectorCodigo],
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
  protected noEncontrada = signal(false);
  protected compra = signal<CompraParaValidar | null>(null);
  protected items = signal<ItemEntrega[]>([]);

  async buscar(codigo: string) {
    if (this.buscando()) {
      return;
    }

    this.buscando.set(true);
    this.compra.set(null);
    this.noEncontrada.set(false);

    const { data, error } = await this.compraServicio.buscarPorCodigo(codigo);

    if (error || !data) {
      this.noEncontrada.set(true);
      this.buscando.set(false);
      return;
    }

    const [{ data: candy }, { data: combos }] = await Promise.all([
      this.compraCandyServicio.listarPorCodigo(codigo),
      this.compraComboServicio.listarPorCodigo(codigo),
    ]);

    this.compra.set(data);
    this.items.set([
      ...(candy ?? []).map((item) => ({
        tipo: 'candy' as const,
        id: item.id,
        nombre: item.producto_candy?.nombre ?? '—',
        cantidad: item.cantidad,
        entregada: item.cantidad_entregada,
      })),
      ...(combos ?? []).map((item) => ({
        tipo: 'combo' as const,
        id: item.id,
        nombre: item.combo?.nombre ?? '—',
        cantidad: item.cantidad,
        entregada: item.cantidad_entregada,
      })),
    ]);
    this.buscando.set(false);
  }

  async entregar(item: ItemEntrega, cantidad: number) {
    const compra = this.compra();

    if (!compra || this.entregando()) {
      return;
    }

    this.entregando.set(true);
    const servicio = item.tipo === 'candy' ? this.compraCandyServicio : this.compraComboServicio;
    const { error } = await servicio.entregar(item.id, cantidad);
    this.entregando.set(false);

    if (error) {
      this.logger.registrar(Flujo.EntregaCandy, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(
      Flujo.EntregaCandy,
      TipoEvento.Exito,
      `${compra.codigo_compra}: ${cantidad}x ${item.nombre}`,
    );

    this.items.update((items) =>
      items.map((actual) =>
        actual.tipo === item.tipo && actual.id === item.id
          ? { ...actual, entregada: actual.entregada + cantidad }
          : actual,
      ),
    );
  }
}
