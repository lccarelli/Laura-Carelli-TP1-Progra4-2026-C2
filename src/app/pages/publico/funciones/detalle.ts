import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toDataURL } from 'qrcode';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../servicios/sala/sala';
import { EntradaServicio } from '../../../servicios/entrada/entrada';
import { ProductoCandyServicio } from '../../../servicios/producto-candy/producto-candy';
import { CompraCandyServicio } from '../../../servicios/compra-candy/compra-candy';
import { ComboServicio, ComboConProductos } from '../../../servicios/combo/combo';
import { CompraComboServicio } from '../../../servicios/compra-combo/compra-combo';
import { CompraServicio } from '../../../servicios/compra/compra';
import { ClienteServicio } from '../../../servicios/cliente/cliente';
import { ConfiguracionCuponServicio } from '../../../servicios/configuracion-cupon/configuracion-cupon';
import { PremioServicio } from '../../../servicios/premio/premio';
import { CanjeServicio } from '../../../servicios/canje/canje';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { Funcion } from '../../../interfaces/funcion';
import { Pelicula } from '../../../interfaces/pelicula';
import { Butaca } from '../../../interfaces/butaca';
import { Entrada } from '../../../interfaces/entrada';
import { ProductoCandy } from '../../../interfaces/producto-candy';
import { Cliente } from '../../../interfaces/cliente';
import { ConfiguracionCupon } from '../../../interfaces/configuracion-cupon';
import { Premio } from '../../../interfaces/premio';
import { premioEsAplicable } from '../../../utilidades/premio';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { MapaButacas } from '../../../componentes/mapa-butacas/mapa-butacas';
import { Poster } from '../../../componentes/poster/poster';
import { Cargando } from '../../../componentes/cargando/cargando';
import { RestriccionEdadPipe } from '../../../pipes/restriccion-edad/restriccion-edad';
import { DiasValidosPipe } from '../../../pipes/dias-validos/dias-validos';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { estaEnPreventa } from '../../../utilidades/preventa';

const TABLA_NO_ENCONTRADA = 'PGRST205';
const ORDEN_PASOS = ['butacas', 'candy', 'pago', 'listo'] as const;
type Paso = (typeof ORDEN_PASOS)[number];
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function calcularEdad(fechaNacimiento: string, fechaReferencia: Date): number {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = fechaReferencia;
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const noCumplioTodavia =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());

  if (noCumplioTodavia) {
    edad--;
  }

  return edad;
}

const PRECIO_POR_TIPO: Record<Butaca['tipo'], number> = {
  normal: 4000,
  accesible: 4000,
  vip: 6000,
};

function quitarPrefijoBase64(dataUrl: string): string {
  const indice = dataUrl.indexOf(',');
  return indice === -1 ? dataUrl : dataUrl.slice(indice + 1);
}

@Component({
  imports: [
    Boton,
    BotonLink,
    MapaButacas,
    Poster,
    Cargando,
    DatePipe,
    UpperCasePipe,
    RestriccionEdadPipe,
    DiasValidosPipe,
  ],
  selector: 'app-detalle-funcion',
  styleUrl: './detalle.css',
  templateUrl: './detalle.html',
})
export class Detalle implements OnDestroy {
  private route = inject(ActivatedRoute);
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private salaServicio = inject(SalaServicio);
  private entradaServicio = inject(EntradaServicio);
  private productoCandyServicio = inject(ProductoCandyServicio);
  private compraCandyServicio = inject(CompraCandyServicio);
  private comboServicio = inject(ComboServicio);
  private compraComboServicio = inject(CompraComboServicio);
  private compraServicio = inject(CompraServicio);
  private clienteServicio = inject(ClienteServicio);
  private configuracionCuponServicio = inject(ConfiguracionCuponServicio);
  private premioServicio = inject(PremioServicio);
  private canjeServicio = inject(CanjeServicio);
  private datePipe = inject(DatePipe);
  protected auth = inject(Auth);
  private errores = inject(Errores);
  private logger = inject(Logger);

  protected funcion = signal<Funcion | null>(null);
  protected pelicula = signal<Pelicula | null>(null);
  protected sala = signal<string>('—');
  protected butacas = signal<Butaca[]>([]);
  protected entradas = signal<Entrada[]>([]);
  protected productosCandy = signal<ProductoCandy[]>([]);
  protected combos = signal<ComboConProductos[]>([]);

  protected paso = signal<Paso>('butacas');
  protected pasoMaximo = signal<Paso>('butacas');
  protected enviando = signal(false);
  protected butacasSeleccionadas = signal<Set<string>>(new Set());
  protected sincronizandoButaca = signal(false);
  protected cantidadCandy = signal<Map<string, number>>(new Map());
  protected cantidadCombo = signal<Map<string, number>>(new Map());
  protected codigoCompra = signal<string | null>(null);
  protected qrDataUrl = signal<string | null>(null);
  protected emailAnonimo = signal('');
  protected edadAnonima = signal<number | null>(null);
  protected mailEnviado = signal<boolean | null>(null);
  protected descuentoAplicado = signal(0);
  protected creditoUsado = signal(0);
  protected cliente = signal<Cliente | null>(null);
  protected cuponConfig = signal<ConfiguracionCupon | null>(null);
  protected premios = signal<Premio[]>([]);
  protected premioSeleccionado = signal<string | null>(null);

  private canalEntradas: ReturnType<EntradaServicio['suscribirCambios']> | null = null;
  private intervaloReloj = setInterval(() => this.ahora.set(Date.now()), 1000);

  protected butacasElegidas = computed(() =>
    this.butacas().filter((butaca) => this.butacasSeleccionadas().has(butaca.id)),
  );

  protected misButacasReservadas = computed(() => {
    const sesionId = this.entradaServicio.sesionId();

    return new Set(
      this.entradas()
        .filter((entrada) => entrada.estado === 'reservada' && entrada.sesion_id === sesionId)
        .map((entrada) => entrada.butaca_id),
    );
  });

  private ahora = signal(Date.now());

  private expiracionReserva = computed(() => {
    const sesionId = this.entradaServicio.sesionId();
    const vencimientos = this.entradas()
      .filter((entrada) => entrada.estado === 'reservada' && entrada.sesion_id === sesionId)
      .map((entrada) =>
        entrada.reservada_hasta ? new Date(entrada.reservada_hasta).getTime() : null,
      )
      .filter((vencimiento): vencimiento is number => vencimiento !== null);

    return vencimientos.length > 0 ? Math.min(...vencimientos) : null;
  });

  protected tiempoRestanteTexto = computed(() => {
    const expira = this.expiracionReserva();

    if (expira === null) {
      return null;
    }

    const segundos = Math.max(0, Math.round((expira - this.ahora()) / 1000));
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;

    return `${minutos}:${resto.toString().padStart(2, '0')}`;
  });

  protected cantidadButacasVip = computed(
    () => this.butacasElegidas().filter((butaca) => butaca.tipo === 'vip').length,
  );

  protected enPreventa = computed(() => {
    const pelicula = this.pelicula();
    return pelicula !== null && estaEnPreventa(pelicula);
  });

  protected subtotalButacas = computed(() => {
    const porcentaje = this.enPreventa() ? (this.pelicula()?.porcentaje_preventa ?? 0) : 0;

    return this.butacasElegidas().reduce(
      (acumulado, butaca) => acumulado + this.precioButaca(butaca.tipo, porcentaje),
      0,
    );
  });

  private precioButaca(tipo: Butaca['tipo'], porcentajeDescuento: number): number {
    const precioNormal = PRECIO_POR_TIPO[tipo];
    return porcentajeDescuento > 0
      ? Math.round(precioNormal * (1 - porcentajeDescuento / 100))
      : precioNormal;
  }

  protected descuentoPreventa = computed(() => {
    if (!this.enPreventa()) {
      return 0;
    }

    const precioNormal = this.butacasElegidas().reduce(
      (acumulado, butaca) => acumulado + PRECIO_POR_TIPO[butaca.tipo],
      0,
    );

    return precioNormal - this.subtotalButacas();
  });

  protected itemsCandy = computed(() => {
    const cantidades = this.cantidadCandy();

    return this.productosCandy()
      .map((producto) => ({ producto, cantidad: cantidades.get(producto.id) ?? 0 }))
      .filter((item) => item.cantidad > 0);
  });

  protected subtotalCandy = computed(() =>
    this.itemsCandy().reduce(
      (acumulado, item) => acumulado + item.producto.precio * item.cantidad,
      0,
    ),
  );

  protected itemsCombo = computed(() => {
    const cantidades = this.cantidadCombo();

    return this.combos()
      .map((combo) => ({ combo, cantidad: cantidades.get(combo.id) ?? 0 }))
      .filter((item) => item.cantidad > 0);
  });

  protected subtotalCombos = computed(() =>
    this.itemsCombo().reduce((acumulado, item) => acumulado + item.combo.precio * item.cantidad, 0),
  );

  protected total = computed(
    () => this.subtotalButacas() + this.subtotalCandy() + this.subtotalCombos(),
  );

  protected cuponAplicable = computed(() => {
    const cliente = this.cliente();
    const config = this.cuponConfig();

    if (!this.auth.esCliente() || !cliente || cliente.cupon_bienvenida_usado || !config) {
      return false;
    }

    if (config.edad_minima === null) {
      return true;
    }

    const edad = this.edadCliente();
    return edad !== null && edad >= config.edad_minima;
  });

  protected descuentoCupon = computed(() =>
    this.cuponAplicable() ? Math.round((this.total() * this.cuponConfig()!.porcentaje) / 100) : 0,
  );

  protected premiosAplicables = computed(() => {
    const funcion = this.funcion();
    const puntos = this.cliente()?.puntos ?? 0;

    if (!this.auth.esCliente() || !funcion) {
      return [];
    }

    const contexto = {
      diaSemana: new Date(funcion.inicio).getDay(),
      cantidadButacas: this.butacasSeleccionadas().size,
    };

    return this.premios()
      .filter((premio) => premio.monto_descuento !== null && premio.costo_puntos <= puntos)
      .map((premio) => ({ premio, aplicable: premioEsAplicable(premio, contexto) }));
  });

  protected premioElegido = computed(() => {
    const id = this.premioSeleccionado();
    if (!id) {
      return null;
    }

    const item = this.premiosAplicables().find((item) => item.premio.id === id);
    return item?.aplicable ? item.premio : null;
  });

  protected descuentoPremio = computed(() => this.premioElegido()?.monto_descuento ?? 0);

  protected creditoDisponible = computed(() =>
    this.auth.esCliente() ? (this.cliente()?.credito ?? 0) : 0,
  );

  protected creditoAplicado = computed(() =>
    Math.min(
      this.creditoDisponible(),
      this.total() - this.descuentoCupon() - this.descuentoPremio(),
    ),
  );

  protected totalFinal = computed(
    () => this.total() - this.descuentoCupon() - this.descuentoPremio() - this.creditoAplicado(),
  );

  protected restriccionEdad = computed(() => this.pelicula()?.restriccion_edad ?? null);

  protected edadCliente = computed(() => {
    const fechaNacimiento = this.auth.usuario()?.user_metadata?.['fecha_nacimiento'] as
      string | undefined;
    const funcion = this.funcion();

    if (!fechaNacimiento || !funcion) {
      return null;
    }

    return calcularEdad(fechaNacimiento, new Date(funcion.inicio));
  });

  protected emailValido = computed(() => EMAIL_VALIDO.test(this.emailAnonimo().trim()));

  protected edadValidaAnonima = computed(() => {
    const restriccion = this.restriccionEdad();
    if (!restriccion) {
      return true;
    }
    const edad = this.edadAnonima();
    return edad !== null && edad >= restriccion;
  });

  protected edadValidaCliente = computed(() => {
    const restriccion = this.restriccionEdad();
    if (!restriccion) {
      return true;
    }
    const edad = this.edadCliente();
    return edad !== null && edad >= restriccion;
  });

  protected puedeConfirmarPago = computed(() =>
    this.auth.esCliente()
      ? this.edadValidaCliente()
      : this.emailValido() && this.edadValidaAnonima(),
  );

  protected emailFinal = computed(() =>
    this.auth.esCliente() ? (this.auth.usuario()?.email ?? '') : this.emailAnonimo().trim(),
  );

  private edadParaGuardar = computed(() =>
    this.auth.esCliente() ? this.edadCliente() : this.edadAnonima(),
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.cargar(id);
    }

    effect(() => {
      const clienteId = this.auth.usuario()?.id;

      if (!this.auth.esCliente() || !clienteId) {
        this.cliente.set(null);
        return;
      }

      this.clienteServicio.obtenerOCrear(clienteId).then(({ data }) => {
        this.cliente.set(data ?? null);
      });
    });
  }

  async cargar(id: string) {
    const { data, error } = await this.funcionServicio.buscarPorId(id);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró la función');
      return;
    }

    this.funcion.set(data);

    const [
      { data: pelicula },
      { data: salas },
      { data: butacas, error: errorButacas },
      { data: productosCandy, error: errorCandy },
      { data: combos, error: errorCombos },
    ] = await Promise.all([
      this.peliculaServicio.buscarPorId(data.pelicula_id),
      this.salaServicio.listar(),
      this.salaServicio.listarButacas(data.sala_id),
      this.productoCandyServicio.listarActivos(),
      this.comboServicio.listarActivos(),
    ]);

    this.pelicula.set(pelicula ?? null);
    this.sala.set(salas?.find((s) => s.id === data.sala_id)?.nombre ?? '—');

    if (errorButacas) {
      this.errores.mostrar(errorButacas.message);
    } else {
      this.butacas.set(butacas ?? []);
    }

    if (errorCandy && errorCandy.code !== TABLA_NO_ENCONTRADA) {
      this.errores.mostrar(errorCandy.message);
    } else {
      this.productosCandy.set(productosCandy ?? []);
    }

    if (errorCombos && errorCombos.code !== TABLA_NO_ENCONTRADA) {
      this.errores.mostrar(errorCombos.message);
    } else {
      this.combos.set(combos ?? []);
    }

    const { data: entradas, error: errorEntradas } =
      await this.entradaServicio.listarPorFuncion(id);

    if (errorEntradas && errorEntradas.code !== TABLA_NO_ENCONTRADA) {
      this.errores.mostrar(errorEntradas.message);
    } else {
      this.entradas.set(entradas ?? []);
    }

    this.canalEntradas = this.entradaServicio.suscribirCambios(id, () =>
      this.actualizarEntradas(id),
    );

    const { data: cuponConfig } = await this.configuracionCuponServicio.obtener();
    this.cuponConfig.set(cuponConfig ?? null);

    const { data: premios } = await this.premioServicio.listarActivas();
    this.premios.set(premios ?? []);
  }

  protected elegirPremio(id: string) {
    this.premioSeleccionado.update((actual) => (actual === id ? null : id));
  }

  private async actualizarEntradas(funcionId: string) {
    const { data: entradas, error } = await this.entradaServicio.listarPorFuncion(funcionId);

    if (!error) {
      this.entradas.set(entradas ?? []);
    }
  }

  ngOnDestroy() {
    if (this.canalEntradas) {
      this.entradaServicio.desuscribir(this.canalEntradas);
    }

    clearInterval(this.intervaloReloj);
  }

  protected irA(destino: Paso) {
    if (ORDEN_PASOS.indexOf(destino) <= ORDEN_PASOS.indexOf(this.pasoMaximo())) {
      this.paso.set(destino);
    }
  }

  protected async alternarButaca(butacaId: string) {
    const funcion = this.funcion();

    if (!funcion || this.sincronizandoButaca()) {
      return;
    }

    const anteriores = this.butacasSeleccionadas();
    const seleccionadas = new Set(anteriores);

    if (seleccionadas.has(butacaId)) {
      seleccionadas.delete(butacaId);
    } else {
      seleccionadas.add(butacaId);
    }

    this.butacasSeleccionadas.set(seleccionadas);
    this.sincronizandoButaca.set(true);
    const { error } = await this.entradaServicio.reservar(funcion.id, [...seleccionadas]);
    this.sincronizandoButaca.set(false);

    if (error) {
      this.butacasSeleccionadas.set(anteriores);
      this.errores.mostrar(error);
    }
  }

  protected cantidadDe(productoId: string): number {
    return this.cantidadCandy().get(productoId) ?? 0;
  }

  protected sumarCandy(productoId: string) {
    const mapa = new Map(this.cantidadCandy());
    mapa.set(productoId, (mapa.get(productoId) ?? 0) + 1);
    this.cantidadCandy.set(mapa);
  }

  protected restarCandy(productoId: string) {
    const mapa = new Map(this.cantidadCandy());
    const actual = mapa.get(productoId) ?? 0;

    if (actual <= 1) {
      mapa.delete(productoId);
    } else {
      mapa.set(productoId, actual - 1);
    }

    this.cantidadCandy.set(mapa);
  }

  protected cantidadComboDe(comboId: string): number {
    return this.cantidadCombo().get(comboId) ?? 0;
  }

  protected sumarCombo(comboId: string) {
    const mapa = new Map(this.cantidadCombo());
    mapa.set(comboId, (mapa.get(comboId) ?? 0) + 1);
    this.cantidadCombo.set(mapa);
  }

  protected restarCombo(comboId: string) {
    const mapa = new Map(this.cantidadCombo());
    const actual = mapa.get(comboId) ?? 0;

    if (actual <= 1) {
      mapa.delete(comboId);
    } else {
      mapa.set(comboId, actual - 1);
    }

    this.cantidadCombo.set(mapa);
  }

  protected productosDeCombo(combo: ComboConProductos): string {
    return combo.combo_producto
      .map((item) => `${item.cantidad}x ${item.producto_candy?.nombre ?? '—'}`)
      .join(', ');
  }

  actualizarEmailAnonimo(valor: string) {
    this.emailAnonimo.set(valor);
  }

  actualizarEdadAnonima(valor: string) {
    const numero = Number(valor);
    this.edadAnonima.set(valor.trim() !== '' && Number.isFinite(numero) ? numero : null);
  }

  private avanzarA(destino: Paso) {
    this.paso.set(destino);

    if (ORDEN_PASOS.indexOf(destino) > ORDEN_PASOS.indexOf(this.pasoMaximo())) {
      this.pasoMaximo.set(destino);
    }
  }

  async confirmarButacas() {
    const funcion = this.funcion();

    if (
      !funcion ||
      this.butacasSeleccionadas().size === 0 ||
      this.enviando() ||
      this.sincronizandoButaca()
    ) {
      return;
    }

    this.enviando.set(true);
    const { error } = await this.entradaServicio.reservar(funcion.id, [
      ...this.butacasSeleccionadas(),
    ]);
    this.enviando.set(false);

    if (error) {
      this.errores.mostrar(error);
      return;
    }

    this.avanzarA('candy');
  }

  seguirACandy() {
    this.avanzarA('pago');
  }

  async confirmarPago() {
    const funcion = this.funcion();

    if (!funcion || this.enviando() || !this.puedeConfirmarPago()) {
      return;
    }

    this.enviando.set(true);
    const codigo = crypto.randomUUID();
    const butacaIds = [...this.butacasSeleccionadas()];

    const { error } = await this.entradaServicio.confirmarCompra(funcion.id, butacaIds, codigo);

    if (error) {
      this.logger.registrar(Flujo.AltaCompra, TipoEvento.Error, error);
      this.errores.mostrar(error);
      this.enviando.set(false);
      return;
    }

    const items = this.itemsCandy().map((item) => ({
      producto_candy_id: item.producto.id,
      cantidad: item.cantidad,
    }));
    const { error: errorCandy } = await this.compraCandyServicio.registrar(codigo, items);

    if (errorCandy) {
      this.logger.registrar(Flujo.AltaCompra, TipoEvento.Error, errorCandy.message);
      this.errores.mostrar(errorCandy.message);
    }

    const itemsCombo = this.itemsCombo().map((item) => ({
      combo_id: item.combo.id,
      cantidad: item.cantidad,
    }));
    const { error: errorCombos } = await this.compraComboServicio.registrar(codigo, itemsCombo);

    if (errorCombos) {
      this.logger.registrar(Flujo.AltaCompra, TipoEvento.Error, errorCombos.message);
      this.errores.mostrar(errorCombos.message);
    }

    let descuento = 0;

    if (this.cuponAplicable()) {
      const descuentoCalculado = this.descuentoCupon();
      const { data: aplicado } = await this.clienteServicio.usarCuponBienvenida();

      if (aplicado) {
        descuento = descuentoCalculado;
      } else {
        this.errores.mostrar(
          'Tu cupón de bienvenida ya se había usado, se cobra el precio completo.',
        );
      }
    }

    let descuentoPremio = 0;
    const premioElegido = this.premioElegido();

    if (premioElegido) {
      const { error: errorCanje } = await this.canjeServicio.canjear(premioElegido.id);

      if (errorCanje) {
        this.errores.mostrar('No se pudo aplicar el premio elegido, se cobra sin ese descuento.');
      } else {
        descuentoPremio = premioElegido.monto_descuento ?? 0;
      }
    }

    let creditoAplicado = 0;

    if (this.auth.esCliente()) {
      const montoCredito = Math.min(
        this.creditoDisponible(),
        this.total() - descuento - descuentoPremio,
      );

      if (montoCredito > 0) {
        const { error: errorCredito } = await this.clienteServicio.usarCredito(
          codigo,
          montoCredito,
        );

        if (errorCredito) {
          this.errores.mostrar('No se pudo aplicar tu crédito, se cobra sin ese descuento.');
        } else {
          creditoAplicado = montoCredito;
        }
      }
    }

    const totalCobrado = this.total() - descuento - descuentoPremio - creditoAplicado;
    this.descuentoAplicado.set(descuento);
    this.creditoUsado.set(creditoAplicado);

    const email = this.emailFinal();
    const { error: errorCompra } = await this.compraServicio.crear({
      codigo_compra: codigo,
      funcion_id: funcion.id,
      cliente_id: this.auth.usuario()?.id ?? null,
      email,
      edad_declarada: this.edadParaGuardar(),
      total: totalCobrado,
      descuento_cupon: descuento,
    });

    if (errorCompra) {
      this.logger.registrar(Flujo.AltaCompra, TipoEvento.Error, errorCompra.message);
      this.errores.mostrar(errorCompra.message);
    }

    if (this.auth.esCliente()) {
      const { error: errorPuntos } = await this.clienteServicio.sumarPuntosCompra(totalCobrado);

      if (errorPuntos) {
        this.logger.registrar(Flujo.AltaCompra, TipoEvento.Error, errorPuntos.message);
      }
    }

    this.codigoCompra.set(codigo);
    const qr = await toDataURL(codigo);
    this.qrDataUrl.set(qr);

    const pelicula = this.pelicula();

    const { error: errorMail } = await this.compraServicio.enviarQrPorMail({
      email,
      codigoCompra: codigo,
      qrBase64: quitarPrefijoBase64(qr),
      posterUrl: pelicula?.imagen_url ?? null,
      peliculaNombre: pelicula?.nombre ?? '',
      restriccionTexto: new RestriccionEdadPipe().transform(pelicula?.restriccion_edad ?? null),
      sala: this.sala(),
      diaHora: this.datePipe.transform(funcion.inicio, 'EEEE dd/MM/yyyy HH:mm') ?? '',
      formato: funcion.formato,
      idioma: funcion.idioma,
      butacasTexto: this.butacasElegidas().map((b) => `${b.fila}${b.numero} (${b.tipo})`),
      candyTexto: this.itemsCandy().map((item) => `${item.cantidad}x ${item.producto.nombre}`),
      combosTexto: this.itemsCombo().map((item) => `${item.cantidad}x ${item.combo.nombre}`),
      total: totalCobrado,
      descuentoCupon: descuento,
    });
    this.mailEnviado.set(!errorMail);

    const clienteId = this.auth.usuario()?.id;

    if (clienteId) {
      try {
        const { error: errorPush } = await this.compraServicio.enviarPushCompraConfirmada(
          clienteId,
          pelicula?.nombre ?? '',
          codigo,
        );

        if (errorPush) {
          this.logger.registrar(Flujo.AvisoPushCompra, TipoEvento.Error, errorPush.message);
        }
      } catch (error) {
        // best-effort: si falla el push no queremos romper la confirmación de la compra
        this.logger.registrar(Flujo.AvisoPushCompra, TipoEvento.Error, String(error));
      }
    }

    this.logger.registrar(Flujo.AltaCompra, TipoEvento.Exito, codigo);
    this.enviando.set(false);
    this.avanzarA('listo');
  }

  descargarComprobante() {
    window.print();
  }
}
