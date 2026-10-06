import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Errores } from '../../../servicios/errores/errores';
import { CompraServicio, CompraParaValidar } from '../../../servicios/compra/compra';
import { EntradaServicio, ButacaDeEntrada } from '../../../servicios/entrada/entrada';
import { Boton } from '../../../componentes/boton/boton';
import { LectorCodigo } from '../../../componentes/lector-codigo/lector-codigo';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

@Component({
  imports: [Boton, DatePipe, LectorCodigo],
  selector: 'app-boleteria',
  styleUrl: './boleteria.css',
  templateUrl: './boleteria.html',
})
export class Boleteria {
  private compraServicio = inject(CompraServicio);
  private entradaServicio = inject(EntradaServicio);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected buscando = signal(false);
  protected validando = signal(false);
  protected noEncontrada = signal(false);
  protected compra = signal<CompraParaValidar | null>(null);
  protected butacas = signal<ButacaDeEntrada[]>([]);

  protected ids(butacas: ButacaDeEntrada[]) {
    return butacas.map((item) => item.id);
  }

  protected pendientes = computed(() => this.butacas().filter((item) => !item.validada_en));

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

    const { data: butacas } = await this.entradaServicio.listarPorCodigoCompra(codigo);

    this.compra.set(data);
    this.butacas.set(butacas ?? []);
    this.buscando.set(false);
  }

  async ingresar(entradaIds: string[]) {
    const compra = this.compra();

    if (!compra || this.validando()) {
      return;
    }

    this.validando.set(true);
    const { error } = await this.entradaServicio.validar(compra.codigo_compra, entradaIds);
    this.validando.set(false);

    if (error) {
      this.logger.registrar(Flujo.ValidacionQr, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(
      Flujo.ValidacionQr,
      TipoEvento.Exito,
      `${compra.codigo_compra} (${entradaIds.length})`,
    );

    const ahora = new Date().toISOString();
    this.butacas.update((butacas) =>
      butacas.map((item) =>
        entradaIds.includes(item.id) ? { ...item, validada_en: ahora } : item,
      ),
    );
  }
}
