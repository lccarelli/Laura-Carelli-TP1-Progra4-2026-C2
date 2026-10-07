import { DestroyRef, Service, computed, effect, inject, signal } from '@angular/core';
import { Butaca } from '../../interfaces/butaca';
import { Entrada } from '../../interfaces/entrada';
import { TABLA_NO_ENCONTRADA } from '../../utilidades/postgrest';
import { EntradaServicio } from '../entrada/entrada';
import { Errores } from '../errores/errores';
import { SalaServicio } from '../sala/sala';

const INTERVALO_RELOJ_MS = 1000;

@Service({ autoProvided: false })
export class ReservaButacas {
  private entradaServicio = inject(EntradaServicio);
  private salaServicio = inject(SalaServicio);
  private errores = inject(Errores);

  private funcionId: string | null = null;
  private canal: ReturnType<EntradaServicio['suscribirCambios']> | null = null;
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

  constructor() {
    effect((alLimpiar) => {
      if (this.expiracion() === null) {
        return;
      }

      this.ahora.set(Date.now());
      const reloj = setInterval(() => this.ahora.set(Date.now()), INTERVALO_RELOJ_MS);
      alLimpiar(() => clearInterval(reloj));
    });

    inject(DestroyRef).onDestroy(() => this.dejarDeEscuchar());
  }

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

    this.canal = this.entradaServicio.suscribirCambios(funcionId, () => this.actualizarEntradas());
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

    return true;
  }

  private async actualizarEntradas() {
    if (!this.funcionId) {
      return;
    }

    const { data: entradas, error } = await this.entradaServicio.listarPorFuncion(this.funcionId);

    if (!error) {
      this.entradasVigentes.set(entradas ?? []);
    }
  }

  private dejarDeEscuchar() {
    if (this.canal) {
      this.entradaServicio.desuscribir(this.canal);
      this.canal = null;
    }
  }
}
