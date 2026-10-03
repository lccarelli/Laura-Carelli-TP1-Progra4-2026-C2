import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PremioServicio } from '../../../../servicios/premio/premio';
import { Errores } from '../../../../servicios/errores/errores';
import { Boton } from '../../../../componentes/boton/boton';
import { SelectorChips } from '../../../../componentes/selector-chips/selector-chips';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

const DIAS_SEMANA = [
  { valor: 1, etiqueta: 'Lun' },
  { valor: 2, etiqueta: 'Mar' },
  { valor: 3, etiqueta: 'Mié' },
  { valor: 4, etiqueta: 'Jue' },
  { valor: 5, etiqueta: 'Vie' },
  { valor: 6, etiqueta: 'Sáb' },
  { valor: 0, etiqueta: 'Dom' },
];

@Component({
  imports: [ReactiveFormsModule, Boton, SelectorChips],
  selector: 'app-formulario-premio',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class FormularioPremio {
  private premioServicio = inject(PremioServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logger = inject(Logger);

  protected id = signal<string | null>(null);
  protected activa = signal(true);
  protected diasSemana = DIAS_SEMANA;
  protected diasSeleccionados = signal<Set<number>>(new Set());

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    costo_puntos: [0, [Validators.required, Validators.min(1)]],
    cantidad_entradas: [null as number | null],
    monto_descuento: [null as number | null],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.id.set(id);
      this.cargar(id);
    }
  }

  async cargar(id: string) {
    const { data, error } = await this.premioServicio.buscarPorId(id);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró el premio');
      return;
    }

    this.formulario.setValue({
      nombre: data.nombre,
      costo_puntos: data.costo_puntos,
      cantidad_entradas: data.cantidad_entradas ?? null,
      monto_descuento: data.monto_descuento ?? null,
    });
    this.activa.set(data.activa);
    this.diasSeleccionados.set(new Set(data.dias_validos ?? []));
  }

  alternarActiva() {
    this.activa.update((valor) => !valor);
  }

  alternarDia(dia: string | number) {
    const dias = new Set(this.diasSeleccionados());

    if (dias.has(dia as number)) {
      dias.delete(dia as number);
    } else {
      dias.add(dia as number);
    }

    this.diasSeleccionados.set(dias);
  }

  actualizarCantidadEntradas(valor: string) {
    const numero = Number(valor);
    this.formulario.controls.cantidad_entradas.setValue(
      valor.trim() !== '' && Number.isFinite(numero) ? numero : null,
    );
  }

  actualizarMontoDescuento(valor: string) {
    const numero = Number(valor);
    this.formulario.controls.monto_descuento.setValue(
      valor.trim() !== '' && Number.isFinite(numero) ? numero : null,
    );
  }

  async guardar() {
    const valores = this.formulario.getRawValue();
    const idExistente = this.id();
    const flujo = idExistente ? Flujo.ModificacionPremio : Flujo.AltaPremio;
    const dias = [...this.diasSeleccionados()];

    const datos = {
      nombre: valores.nombre,
      costo_puntos: valores.costo_puntos,
      activa: this.activa(),
      dias_validos: dias.length > 0 ? dias : null,
      cantidad_entradas: valores.cantidad_entradas,
      monto_descuento: valores.monto_descuento,
    };

    if (idExistente) {
      const { error } = await this.premioServicio.editar({ ...datos, id: idExistente });

      if (error) {
        this.logger.registrar(flujo, TipoEvento.Error, error.message);
        this.errores.mostrar(error.message);
        return;
      }
    } else {
      const { data: premioCreado, error } = await this.premioServicio.crear(datos);

      if (error) {
        this.logger.registrar(flujo, TipoEvento.Error, error.message);
        this.errores.mostrar(error.message);
        return;
      }

      if (datos.activa && premioCreado) {
        this.avisarPremioNuevo(premioCreado.id, premioCreado.nombre, premioCreado.costo_puntos);
      }
    }

    this.logger.registrar(flujo, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/premios']);
  }

  private async avisarPremioNuevo(id: string, nombre: string, costoPuntos: number) {
    try {
      const { error } = await this.premioServicio.avisarPorPush(id, nombre, costoPuntos);

      if (error) {
        this.logger.registrar(Flujo.AvisoPushPremio, TipoEvento.Error, error.message);
      } else {
        this.logger.registrar(Flujo.AvisoPushPremio, TipoEvento.Exito, nombre);
      }
    } catch (error) {
      // best-effort: si falla el aviso push no queremos romper el alta del premio
      this.logger.registrar(Flujo.AvisoPushPremio, TipoEvento.Error, String(error));
    }
  }

  cancelar() {
    this.router.navigate(['/admin/premios']);
  }

  async eliminarPremio() {
    const id = this.id();
    if (!id) return;

    const { error } = await this.premioServicio.eliminar(id);

    if (error) {
      this.logger.registrar(Flujo.BajaPremio, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
    } else {
      this.logger.registrar(Flujo.BajaPremio, TipoEvento.Exito, id);
      await this.router.navigate(['/admin/premios']);
    }
  }
}
