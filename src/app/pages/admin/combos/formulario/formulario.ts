import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logger = inject(Logger);

  protected id = signal<string | null>(null);
  protected activo = signal(true);
  protected productosCandy = signal<ProductoCandy[]>([]);
  protected cantidades = signal<Map<string, number>>(new Map());

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    this.cargarProductosCandy();

    if (id) {
      this.id.set(id);
      this.cargar(id);
    }
  }

  async cargarProductosCandy() {
    const { data, error } = await this.productoCandyServicio.listarActivos();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.productosCandy.set(data ?? []);
    }
  }

  async cargar(id: string) {
    const { data, error } = await this.comboServicio.buscarPorId(id);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró el combo');
      return;
    }

    this.formulario.setValue({
      nombre: data.nombre,
      precio: data.precio,
    });
    this.activo.set(data.activo);

    const cantidades = new Map<string, number>();
    for (const item of data.combo_producto) {
      if (item.producto_candy_id) {
        cantidades.set(item.producto_candy_id, item.cantidad);
      }
    }
    this.cantidades.set(cantidades);
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
    const idExistente = this.id();
    const flujo = idExistente ? Flujo.ModificacionCombo : Flujo.AltaCombo;
    const items = [...this.cantidades().entries()].map(([producto_candy_id, cantidad]) => ({
      producto_candy_id,
      cantidad,
    }));

    if (items.length === 0) {
      this.errores.mostrar('El combo necesita al menos un producto con cantidad.');
      return;
    }

    const datos = {
      nombre: valores.nombre,
      precio: valores.precio,
      activo: this.activo(),
    };

    let comboId: string;

    if (idExistente) {
      const { error } = await this.comboServicio.editar({ ...datos, id: idExistente });

      if (error) {
        this.logger.registrar(flujo, TipoEvento.Error, error.message);
        this.errores.mostrar(error.message);
        return;
      }

      comboId = idExistente;
    } else {
      const { data, error } = await this.comboServicio.crear(datos);

      if (error || !data) {
        const mensaje = error?.message ?? 'No se pudo crear el combo.';
        this.logger.registrar(flujo, TipoEvento.Error, mensaje);
        this.errores.mostrar(mensaje);
        return;
      }

      comboId = data[0].id;
    }

    const { error: errorProductos } = await this.comboServicio.asignarProductos(comboId, items);

    if (errorProductos) {
      this.logger.registrar(flujo, TipoEvento.Error, errorProductos.message);
      this.errores.mostrar(errorProductos.message);
      return;
    }

    this.logger.registrar(flujo, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/combos']);
  }

  cancelar() {
    this.router.navigate(['/admin/combos']);
  }

  async eliminarCombo() {
    const id = this.id();
    if (!id) return;

    const { error } = await this.comboServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaCombo, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaCombo, TipoEvento.Exito, id);
      await this.router.navigate(['/admin/combos']);
    }
  }
}
