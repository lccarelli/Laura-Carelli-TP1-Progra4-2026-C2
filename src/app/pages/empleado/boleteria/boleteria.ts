import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Errores } from '../../../servicios/errores/errores';
import { CompraServicio, CompraParaValidar } from '../../../servicios/compra/compra';
import { EntradaServicio, ButacaDeEntrada } from '../../../servicios/entrada/entrada';
import { AvisoUso } from '../../../componentes/aviso-uso/aviso-uso';
import { LectorCodigo } from '../../../componentes/lector-codigo/lector-codigo';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

type EstadoEntradas = 'habilitado' | 'usado';

@Component({
  imports: [AvisoUso, DatePipe, LectorCodigo],
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
  protected compraNoEncontrada = signal(false);
  protected compra = signal<CompraParaValidar | null>(null);
  protected entradas = signal<ButacaDeEntrada[]>([]);
  protected estado = signal<EstadoEntradas | null>(null);

  protected entradasPendientes = computed(() =>
    this.entradas().filter((entrada) => !entrada.validada_en),
  );

  protected ultimoIngreso = computed(() =>
    this.entradas().reduce<string | null>(
      (ultimo, entrada) =>
        entrada.validada_en && (!ultimo || entrada.validada_en > ultimo)
          ? entrada.validada_en
          : ultimo,
      null,
    ),
  );

  async buscar(codigo: string) {
    if (this.buscando() || this.validando()) {
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

    const cargadas = await this.cargarEntradas(codigo);
    this.buscando.set(false);

    if (!cargadas) {
      return;
    }

    this.compra.set(data);

    if (data.cancelada_en || this.entradas().length === 0) {
      return;
    }

    if (this.entradasPendientes().length === 0) {
      this.estado.set('usado');
      return;
    }

    await this.validarPendientes(codigo);
  }

  private async cargarEntradas(codigo: string) {
    const { data, error } = await this.entradaServicio.listarPorCodigoCompra(codigo);

    if (error) {
      this.logger.registrar(Flujo.ValidacionQr, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return false;
    }

    this.entradas.set(data ?? []);
    return true;
  }

  private async validarPendientes(codigo: string) {
    const idsPendientes = this.entradasPendientes().map((entrada) => entrada.id);

    this.validando.set(true);
    const { error } = await this.entradaServicio.validar(codigo, idsPendientes);
    this.validando.set(false);

    if (error) {
      this.logger.registrar(Flujo.ValidacionQr, TipoEvento.Error, error.message);
      await this.cargarEntradas(codigo);

      if (this.entradasPendientes().length === 0) {
        this.estado.set('usado');
      } else {
        this.errores.mostrar(error.message);
      }

      return;
    }

    this.logger.registrar(
      Flujo.ValidacionQr,
      TipoEvento.Exito,
      `${codigo} (${idsPendientes.length})`,
    );

    const validadaEn = new Date().toISOString();
    this.entradas.update((entradas) =>
      entradas.map((entrada) =>
        idsPendientes.includes(entrada.id) ? { ...entrada, validada_en: validadaEn } : entrada,
      ),
    );
    this.estado.set('habilitado');

    await this.avisarPorPush(codigo);
  }

  private async avisarPorPush(codigo: string) {
    try {
      const { error } = await this.compraServicio.enviarPushDeUso(codigo, 'entrada');

      if (error) {
        this.logger.registrar(Flujo.AvisoPushUso, TipoEvento.Error, error.message);
      }
    } catch (error) {
      // best-effort: si falla el push no queremos deshacer el ingreso ya validado
      this.logger.registrar(Flujo.AvisoPushUso, TipoEvento.Error, String(error));
    }
  }
}
