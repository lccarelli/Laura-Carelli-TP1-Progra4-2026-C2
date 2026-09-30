import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ComboServicio } from '../../../../servicios/combo/combo';
import { ProductoCandyServicio } from '../../../../servicios/producto-candy/producto-candy';
import { Errores } from '../../../../servicios/errores/errores';
import { ProductoCandy } from '../../../../interfaces/producto-candy';
import { Boton } from '../../../../componentes/boton/boton';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

@Component({
  imports: [ReactiveFormsModule, Boton],
  selector: 'app-formulario-combo',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class FormularioCombo {
  private comboServicio = inject(ComboServicio);
  private productoCandyServicio = inject(ProductoCandyServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private logger = inject(Logger);

  protected activo = signal(true);
  protected productosCandy = signal<ProductoCandy[]>([]);
  protected cantidades = signal<Map<string, number>>(new Map());

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.cargarProductosCandy();
  }

  async cargarProductosCandy() {
    const { data, error } = await this.productoCandyServicio.listarActivos();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.productosCandy.set(data ?? []);
    }
  }

  alternarActivo() {
    this.activo.update((valor) => !valor);
  }

  protected cantidadDe(productoId: string): number {
    return this.cantidades().get(productoId) ?? 0;
  }

  actualizarCantidad(productoId: string, valor: string) {
    const numero = Number(valor);
    const cantidades = new Map(this.cantidades());

    if (!valor.trim() || !Number.isFinite(numero) || numero <= 0) {
      cantidades.delete(productoId);
    } else {
      cantidades.set(productoId, numero);
    }

    this.cantidades.set(cantidades);
  }

  async guardar() {
    const valores = this.formulario.getRawValue();
    const items = [...this.cantidades().entries()].map(([producto_candy_id, cantidad]) => ({
      producto_candy_id,
      cantidad,
    }));

    if (items.length === 0) {
      this.errores.mostrar('El combo necesita al menos un producto con cantidad.');
      return;
    }

    const { data, error } = await this.comboServicio.crear({
      nombre: valores.nombre,
      precio: valores.precio,
      activo: this.activo(),
    });

    if (error || !data) {
      const mensaje = error?.message ?? 'No se pudo crear el combo.';
      this.logger.registrar(Flujo.AltaCombo, TipoEvento.Error, mensaje);
      this.errores.mostrar(mensaje);
      return;
    }

    const { error: errorProductos } = await this.comboServicio.asignarProductos(data[0].id, items);

    if (errorProductos) {
      this.logger.registrar(Flujo.AltaCombo, TipoEvento.Error, errorProductos.message);
      this.errores.mostrar(errorProductos.message);
      return;
    }

    this.logger.registrar(Flujo.AltaCombo, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/combos']);
  }

  cancelar() {
    this.router.navigate(['/admin/combos']);
  }
}
