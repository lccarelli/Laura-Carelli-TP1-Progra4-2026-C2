import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private logger = inject(Logger);

  protected activa = signal(true);
  protected diasSemana = DIAS_SEMANA;
  protected diasSeleccionados = signal<Set<number>>(new Set());

  protected formulario = this.formBuilder.nonNullable.group({
    nombre: ['', Validators.required],
    costo_puntos: [0, [Validators.required, Validators.min(1)]],
    cantidad_entradas: [null as number | null],
  });

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

  async guardar() {
    const valores = this.formulario.getRawValue();
    const dias = [...this.diasSeleccionados()];
    const { error } = await this.premioServicio.crear({
      nombre: valores.nombre,
      costo_puntos: valores.costo_puntos,
      activa: this.activa(),
      dias_validos: dias.length > 0 ? dias : null,
      cantidad_entradas: valores.cantidad_entradas,
    });

    if (error) {
      this.logger.registrar(Flujo.AltaPremio, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.AltaPremio, TipoEvento.Exito, valores.nombre);
    await this.router.navigate(['/admin/premios']);
  }

  cancelar() {
    this.router.navigate(['/admin/premios']);
  }
}
