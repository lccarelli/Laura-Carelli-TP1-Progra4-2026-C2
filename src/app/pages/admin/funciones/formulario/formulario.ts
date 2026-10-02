import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FuncionServicio, ResultadoOcurrencia } from '../../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { Errores } from '../../../../servicios/errores/errores';
import { Pelicula } from '../../../../interfaces/pelicula';
import { FuncionPorCrear } from '../../../../interfaces/funcion-por-crear';
import { FuncionRecurrentePorCrear } from '../../../../interfaces/funcion-recurrente-por-crear';
import { Boton } from '../../../../componentes/boton/boton';
import { SelectorChips } from '../../../../componentes/selector-chips/selector-chips';
import { RestriccionEdadPipe } from '../../../../pipes/restriccion-edad/restriccion-edad';
import { DatePipe } from '@angular/common';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';

const MARGEN_MINUTOS = 30;

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
  imports: [ReactiveFormsModule, Boton, SelectorChips, RestriccionEdadPipe, DatePipe],
  selector: 'app-formulario-funcion',
  styleUrl: './formulario.css',
  templateUrl: './formulario.html',
})
export class FormularioFuncion {
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private errores = inject(Errores);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private logger = inject(Logger);

  protected diasSemana = DIAS_SEMANA;
  protected peliculas = signal<Pelicula[]>([]);
  protected modo = signal<'unica' | 'recurrente'>('unica');
  protected diasSeleccionados = signal<Set<number>>(new Set());
  protected resultados = signal<ResultadoOcurrencia[] | null>(null);
  protected enviando = signal(false);

  protected formulario = this.formBuilder.nonNullable.group({
    pelicula_id: ['', Validators.required],
    inicio: [''],
    hora: [''],
    desde: [''],
    hasta: [''],
    formato: ['2d', Validators.required],
    idioma: ['castellano', Validators.required],
  });

  private peliculaIdSeleccionada = toSignal(this.formulario.controls.pelicula_id.valueChanges, {
    initialValue: '',
  });
  private inicioIngresado = toSignal(this.formulario.controls.inicio.valueChanges, {
    initialValue: '',
  });
  private horaIngresada = toSignal(this.formulario.controls.hora.valueChanges, {
    initialValue: '',
  });

  protected peliculaSeleccionada = computed(() =>
    this.peliculas().find((pelicula) => pelicula.id === this.peliculaIdSeleccionada()),
  );

  protected horarioCalculado = computed(() => {
    const pelicula = this.peliculaSeleccionada();
    const horaTexto = this.modo() === 'unica' ? this.inicioIngresado() : this.horaIngresada();

    if (!pelicula || !horaTexto) {
      return null;
    }

    const inicio = this.modo() === 'unica' ? new Date(horaTexto) : this.horaDeHoy(horaTexto);

    if (isNaN(inicio.getTime())) {
      return null;
    }

    const fin = new Date(inicio.getTime() + pelicula.duracion_minutos * 60_000);
    const salaLibreDesde = new Date(fin.getTime() + MARGEN_MINUTOS * 60_000);

    return { fin, salaLibreDesde };
  });

  constructor() {
    this.cargarPeliculas();

    effect(() => {
      const controles = this.formulario.controls;

      if (this.modo() === 'unica') {
        controles.inicio.setValidators(Validators.required);
        controles.hora.clearValidators();
        controles.desde.clearValidators();
        controles.hasta.clearValidators();
      } else {
        controles.inicio.clearValidators();
        controles.hora.setValidators(Validators.required);
        controles.desde.setValidators(Validators.required);
        controles.hasta.setValidators(Validators.required);
      }

      controles.inicio.updateValueAndValidity({ emitEvent: false });
      controles.hora.updateValueAndValidity({ emitEvent: false });
      controles.desde.updateValueAndValidity({ emitEvent: false });
      controles.hasta.updateValueAndValidity({ emitEvent: false });
    });
  }

  protected puedeGuardar = computed(
    () => (this.modo() === 'unica' || this.diasSeleccionados().size > 0) && !this.enviando(),
  );

  async cargarPeliculas() {
    const { data, error } = await this.peliculaServicio.listar();

    if (error) {
      this.errores.mostrar(error.message);
    } else {
      this.peliculas.set(data ?? []);
    }
  }

  cambiarModo(modo: 'unica' | 'recurrente') {
    this.modo.set(modo);
    this.resultados.set(null);
  }

  alternarDia(valor: string | number) {
    const numero = Number(valor);
    const dias = new Set(this.diasSeleccionados());

    if (dias.has(numero)) {
      dias.delete(numero);
    } else {
      dias.add(numero);
    }

    this.diasSeleccionados.set(dias);
  }

  async guardar() {
    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);

    try {
      if (this.modo() === 'unica') {
        await this.guardarUnica();
      } else {
        await this.guardarRecurrente();
      }
    } finally {
      this.enviando.set(false);
    }
  }

  private async guardarUnica() {
    const { error } = await this.funcionServicio.crear(this.valoresUnica());

    if (error) {
      this.logger.registrar(Flujo.AltaFuncion, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.logger.registrar(Flujo.AltaFuncion, TipoEvento.Exito, this.peliculaSeleccionada()?.nombre);
    await this.router.navigate(['/admin/funciones']);
  }

  private async guardarRecurrente() {
    const { error, resultados } = await this.funcionServicio.crearRecurrente(
      this.valoresRecurrente(),
    );

    if (error) {
      this.logger.registrar(Flujo.AltaFuncion, TipoEvento.Error, error.message);
      this.errores.mostrar(error.message);
      return;
    }

    this.resultados.set(resultados ?? []);

    const fallidas = (resultados ?? []).filter((r) => r.error);
    const pelicula = this.peliculaSeleccionada()?.nombre;

    if (fallidas.length > 0) {
      this.logger.registrar(
        Flujo.AltaFuncion,
        TipoEvento.Error,
        `${pelicula}: ${fallidas.length} de ${(resultados ?? []).length} ocurrencias fallaron`,
      );
      this.errores.mostrar(
        `Se crearon ${(resultados ?? []).length - fallidas.length} de ${(resultados ?? []).length} funciones. Revisá el detalle abajo.`,
      );
    } else {
      this.logger.registrar(
        Flujo.AltaFuncion,
        TipoEvento.Exito,
        `${pelicula}: ${(resultados ?? []).length} funciones`,
      );
      await this.router.navigate(['/admin/funciones']);
    }
  }

  cancelar() {
    this.router.navigate(['/admin/funciones']);
  }

  private valoresUnica(): FuncionPorCrear {
    const valores = this.formulario.getRawValue();

    return {
      pelicula_id: valores.pelicula_id,
      inicio: valores.inicio,
      formato: valores.formato as FuncionPorCrear['formato'],
      idioma: valores.idioma as FuncionPorCrear['idioma'],
    };
  }

  private valoresRecurrente(): FuncionRecurrentePorCrear {
    const valores = this.formulario.getRawValue();

    return {
      pelicula_id: valores.pelicula_id,
      dias: [...this.diasSeleccionados()],
      hora: valores.hora,
      desde: valores.desde,
      hasta: valores.hasta,
      formato: valores.formato as FuncionRecurrentePorCrear['formato'],
      idioma: valores.idioma as FuncionRecurrentePorCrear['idioma'],
    };
  }

  private horaDeHoy(hora: string): Date {
    const [horas, minutos] = hora.split(':').map(Number);
    const fecha = new Date();
    fecha.setHours(horas, minutos, 0, 0);
    return fecha;
  }
}
