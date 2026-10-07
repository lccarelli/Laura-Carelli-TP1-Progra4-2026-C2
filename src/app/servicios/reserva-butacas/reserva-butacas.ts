import { computed, signal } from '@angular/core';
import { Butaca } from '../../interfaces/butaca';
import { Entrada } from '../../interfaces/entrada';
import { guardarEntrada, quitarEntrada } from '../../utilidades/entrada';
import { TABLA_NO_ENCONTRADA } from '../../utilidades/postgrest';
import { CambioDeEntrada, EntradaServicio } from '../entrada/entrada';
import { Errores } from '../errores/errores';
import { SalaServicio } from '../sala/sala';

const INTERVALO_RELOJ_MS = 1000;

export class ReservaButacas {
  private funcionId: string | null = null;
  private reloj: ReturnType<typeof setInterval> | null = null;
  private ahora = signal(Date.now());

  private butacasDeSala = signal<Butaca[]>([]);
  private entradasVigentes = signal<Entrada[]>([]);
  private idsSeleccionados = signal<ReadonlySet<string>>(new Set());
  private ocupado = signal(false);

  readonly butacas = this.butacasDeSala.asReadonly();
  readonly entradas = this.entradasVigentes.asReadonly();
  readonly seleccionadas = this.idsSeleccionados.asReadonly();
  readonly sincronizando = this.ocupado.asReadonly();

  readonly elegidas = computed(() =>
    this.butacas().filter((butaca) => this.seleccionadas().has(butaca.id)),
  );

  private reservasPropias = computed(() => {
    const sesionId = this.entradaServicio.sesionId();

    return this.entradas().filter(
      (entrada) => entrada.estado === 'reservada' && entrada.sesion_id === sesionId,
    );
  });

  readonly propias = computed(
    () => new Set(this.reservasPropias().map((entrada) => entrada.butaca_id)),
  );

  private expiracion = computed(() => {
    const vencimientos = this.reservasPropias()
      .map((entrada) =>
        entrada.reservada_hasta ? new Date(entrada.reservada_hasta).getTime() : null,
      )
      .filter((vencimiento): vencimiento is number => vencimiento !== null);

    return vencimientos.length > 0 ? Math.min(...vencimientos) : null;
  });

  readonly tiempoRestanteTexto = computed(() => {
    const expira = this.expiracion();

    if (expira === null) {
      return null;
    }

    const segundos = Math.max(0, Math.round((expira - this.ahora()) / 1000));
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;

    return `${minutos}:${resto.toString().padStart(2, '0')}`;
  });

  constructor(
    private entradaServicio: EntradaServicio,
    private salaServicio: SalaServicio,
    private errores: Errores,
  ) {}

  async cargar(funcionId: string, salaId: string) {
    this.funcionId = funcionId;

    const [{ data: butacas, error: errorButacas }, { data: entradas, error: errorEntradas }] =
      await Promise.all([
        this.salaServicio.listarButacas(salaId),
        this.entradaServicio.listarPorFuncion(funcionId),
      ]);

    if (errorButacas) {
      this.errores.mostrar(errorButacas.message);
    } else {
      this.butacasDeSala.set(butacas ?? []);
    }

    if (errorEntradas && errorEntradas.code !== TABLA_NO_ENCONTRADA) {
      this.errores.mostrar(errorEntradas.message);
    } else {
      this.entradasVigentes.set(entradas ?? []);
    }

    this.actualizarReloj();
  }

  aplicarCambio(cambio: CambioDeEntrada) {
    switch (cambio.eventType) {
      case 'INSERT':
      case 'UPDATE':
        this.entradasVigentes.update((actuales) => guardarEntrada(actuales, cambio.new));
        break;
      case 'DELETE':
        if (cambio.old.id) {
          const id = cambio.old.id;
          this.entradasVigentes.update((actuales) => quitarEntrada(actuales, id));
        }
        break;
    }

    this.actualizarReloj();
  }

  async recargarEntradas() {
    if (!this.funcionId) {
      return;
    }

    const { data: entradas, error } = await this.entradaServicio.listarPorFuncion(this.funcionId);

    if (!error) {
      this.entradasVigentes.set(entradas ?? []);
      this.actualizarReloj();
    }
  }

  destruir() {
    this.detenerReloj();
  }

  async alternar(butacaId: string) {
    if (!this.funcionId || this.ocupado()) {
      return;
    }

    const anteriores = this.seleccionadas();
    const nuevas = new Set(anteriores);

    if (nuevas.has(butacaId)) {
      nuevas.delete(butacaId);
    } else {
      nuevas.add(butacaId);
    }

    this.idsSeleccionados.set(nuevas);
    this.ocupado.set(true);
    const { error } = await this.entradaServicio.reservar(this.funcionId, [...nuevas]);
    this.ocupado.set(false);

    if (error) {
      this.idsSeleccionados.set(anteriores);
      this.errores.mostrar(error);
    }
  }

  async confirmar(): Promise<boolean> {
    if (!this.funcionId || this.seleccionadas().size === 0 || this.ocupado()) {
      return false;
    }

    const { error } = await this.entradaServicio.reservar(this.funcionId, [
      ...this.seleccionadas(),
    ]);

    if (error) {
      this.errores.mostrar(error);
      return false;
    }

    await this.recargarEntradas();

    return true;
  }

  private actualizarReloj() {
    if (this.expiracion() === null) {
      this.detenerReloj();
    } else if (!this.reloj) {
      this.ahora.set(Date.now());
      this.reloj = setInterval(() => this.ahora.set(Date.now()), INTERVALO_RELOJ_MS);
    }
  }

  private detenerReloj() {
    if (this.reloj) {
      clearInterval(this.reloj);
      this.reloj = null;
    }
  }
}
