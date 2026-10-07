import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../servicios/sala/sala';
import { EntradaServicio } from '../../../servicios/entrada/entrada';
import { ReservaButacas } from '../../../servicios/reserva-butacas/reserva-butacas';
import { ProductoCandyServicio } from '../../../servicios/producto-candy/producto-candy';
import { ComboServicio, ComboConProductos } from '../../../servicios/combo/combo';
import { PedidoCompra, ProcesoCompra } from '../../../servicios/proceso-compra/proceso-compra';
import { ClienteServicio } from '../../../servicios/cliente/cliente';
import { ConfiguracionCuponServicio } from '../../../servicios/configuracion-cupon/configuracion-cupon';
import { PremioServicio } from '../../../servicios/premio/premio';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { Funcion } from '../../../interfaces/funcion';
import { Pelicula } from '../../../interfaces/pelicula';
import { ProductoCandy } from '../../../interfaces/producto-candy';
import { Cliente } from '../../../interfaces/cliente';
import { ConfiguracionCupon } from '../../../interfaces/configuracion-cupon';
import { LineaDescuento } from '../../../interfaces/linea-descuento';
import { LineaResumen } from '../../../interfaces/linea-resumen';
import { Premio } from '../../../interfaces/premio';
import { premioEsAplicable } from '../../../utilidades/premio';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { MapaButacas } from '../../../componentes/mapa-butacas/mapa-butacas';
import { Cargando } from '../../../componentes/cargando/cargando';
import { FichaFuncion } from '../../../componentes/ficha-funcion/ficha-funcion';
import { PasosCompra } from '../../../componentes/pasos-compra/pasos-compra';
import { AvisoEdad } from '../../../componentes/aviso-edad/aviso-edad';
import { ConfirmacionCompra } from '../../../componentes/confirmacion-compra/confirmacion-compra';
import { ResumenCompra } from '../../../componentes/resumen-compra/resumen-compra';
import { AccesoCompra } from '../../../componentes/acceso-compra/acceso-compra';
import { SeleccionCandy } from '../../../componentes/seleccion-candy/seleccion-candy';
import { PasoCompra, pasoMasAvanzado, puedeIrA } from '../../../utilidades/pasos-compra';
import { Cantidades } from '../../../utilidades/cantidades';
import { generarCodigoCompra } from '../../../utilidades/codigo-compra';
import { TABLA_NO_ENCONTRADA } from '../../../utilidades/postgrest';
import { estaEnPreventa } from '../../../utilidades/preventa';
import { calcularEdad, cumpleEdadMinima } from '../../../utilidades/edad';
import {
  calcularCredito,
  calcularDescuentoCupon,
  calcularTotalAPagar,
  descuentoDePreventa,
  PRECIOS_POR_DEFECTO,
  precioDeButacas,
  preciosDeFuncion,
} from '../../../utilidades/precios';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  imports: [
    Boton,
    BotonLink,
    MapaButacas,
    Cargando,
    SeleccionCandy,
    AccesoCompra,
    FichaFuncion,
    PasosCompra,
    AvisoEdad,
    ResumenCompra,
    ConfirmacionCompra,
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
  private comboServicio = inject(ComboServicio);
  private procesoCompra = inject(ProcesoCompra);
  private clienteServicio = inject(ClienteServicio);
  private configuracionCuponServicio = inject(ConfiguracionCuponServicio);
  private premioServicio = inject(PremioServicio);
  protected auth = inject(Auth);
  private errores = inject(Errores);

  protected reserva = new ReservaButacas(this.entradaServicio, this.salaServicio, this.errores);

  private canalEntradas: ReturnType<EntradaServicio['suscribirCambios']> | null = null;

  protected funcion = signal<Funcion | null>(null);
  protected pelicula = signal<Pelicula | null>(null);
  protected sala = signal<string>('—');
  protected productosCandy = signal<ProductoCandy[]>([]);
  protected combos = signal<ComboConProductos[]>([]);

  protected paso = signal<PasoCompra>('butacas');
  protected pasoMaximo = signal<PasoCompra>('butacas');
  protected enviando = signal(false);
  protected carritoCandy = new Cantidades();
  protected carritoCombos = new Cantidades();
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

  protected enPreventa = computed(() => {
    const pelicula = this.pelicula();
    return pelicula !== null && estaEnPreventa(pelicula);
  });

  private porcentajePreventa = computed(() =>
    this.enPreventa() ? (this.pelicula()?.porcentaje_preventa ?? 0) : 0,
  );

  private preciosButaca = computed(() => {
    const funcion = this.funcion();
    return funcion ? preciosDeFuncion(funcion) : PRECIOS_POR_DEFECTO;
  });

  protected subtotalButacas = computed(() =>
    precioDeButacas(this.reserva.elegidas(), this.preciosButaca(), this.porcentajePreventa()),
  );

  protected descuentoPreventa = computed(() =>
    descuentoDePreventa(this.reserva.elegidas(), this.preciosButaca(), this.porcentajePreventa()),
  );

  protected itemsCandy = computed(() => {
    const cantidades = this.carritoCandy.valores();

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
    const cantidades = this.carritoCombos.valores();

    return this.combos()
      .map((combo) => ({ combo, cantidad: cantidades.get(combo.id) ?? 0 }))
      .filter((item) => item.cantidad > 0);
  });

  protected subtotalCombos = computed(() =>
    this.itemsCombo().reduce((acumulado, item) => acumulado + item.combo.precio * item.cantidad, 0),
  );

  protected lineasCombo = computed<LineaResumen[]>(() =>
    this.itemsCombo().map((item) => ({ cantidad: item.cantidad, nombre: item.combo.nombre })),
  );

  protected lineasCandy = computed<LineaResumen[]>(() =>
    this.itemsCandy().map((item) => ({ cantidad: item.cantidad, nombre: item.producto.nombre })),
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

    return cumpleEdadMinima(this.edadCliente(), config.edad_minima);
  });

  protected descuentoCupon = computed(() =>
    this.cuponAplicable()
      ? calcularDescuentoCupon(this.total(), this.cuponConfig()?.porcentaje ?? 0)
      : 0,
  );

  protected premiosAplicables = computed(() => {
    const funcion = this.funcion();
    const puntos = this.cliente()?.puntos ?? 0;

    if (!this.auth.esCliente() || !funcion) {
      return [];
    }

    const contexto = {
      diaSemana: new Date(funcion.inicio).getDay(),
      cantidadButacas: this.reserva.seleccionadas().size,
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
    calcularCredito(
      this.creditoDisponible(),
      this.total(),
      this.descuentoCupon() + this.descuentoPremio(),
    ),
  );

  protected totalFinal = computed(() =>
    calcularTotalAPagar(
      this.total(),
      this.descuentoCupon() + this.descuentoPremio(),
      this.creditoAplicado(),
    ),
  );

  protected lineasDescuento = computed(() => {
    const lineas: LineaDescuento[] = [];

    if (this.enPreventa()) {
      lineas.push({
        etiqueta: `Precio de preventa (-${this.porcentajePreventa()}%)`,
        monto: this.descuentoPreventa(),
      });
    }

    if (this.cuponAplicable()) {
      lineas.push({
        etiqueta: `Cupón de bienvenida (-${this.cuponConfig()?.porcentaje}%)`,
        monto: this.descuentoCupon(),
      });
    }

    if (this.descuentoPremio() > 0) {
      lineas.push({ etiqueta: this.premioElegido()?.nombre ?? '', monto: this.descuentoPremio() });
    }

    if (this.creditoAplicado() > 0) {
      lineas.push({ etiqueta: 'Crédito disponible', monto: this.creditoAplicado() });
    }

    return lineas;
  });

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

  protected edadValidaAnonima = computed(() =>
    cumpleEdadMinima(this.edadAnonima(), this.restriccionEdad()),
  );

  protected edadValidaCliente = computed(() =>
    cumpleEdadMinima(this.edadCliente(), this.restriccionEdad()),
  );

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
      this.cargarCliente();
    });
  }

  private async cargarCliente() {
    const clienteId = this.auth.usuario()?.id;

    if (!this.auth.esCliente() || !clienteId) {
      this.cliente.set(null);
      return;
    }

    const { data } = await this.clienteServicio.obtenerOCrear(clienteId);
    this.cliente.set(data ?? null);
  }

  private async cargar(id: string) {
    const { data, error } = await this.funcionServicio.buscarPorId(id);

    if (error || !data) {
      this.errores.mostrar(error?.message ?? 'No se encontró la función');
      return;
    }

    this.funcion.set(data);

    const [
      { data: pelicula },
      { data: salas },
      { data: productosCandy, error: errorCandy },
      { data: combos, error: errorCombos },
    ] = await Promise.all([
      this.peliculaServicio.buscarPorId(data.pelicula_id),
      this.salaServicio.listar(),
      this.productoCandyServicio.listarActivos(),
      this.comboServicio.listarActivos(),
    ]);

    this.pelicula.set(pelicula ?? null);
    this.sala.set(salas?.find((s) => s.id === data.sala_id)?.nombre ?? '—');

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

    await this.reserva.cargar(id, data.sala_id);
    this.canalEntradas = this.entradaServicio.suscribirCambios(
      id,
      (cambio) => this.reserva.aplicarCambio(cambio),
      () => this.reserva.recargarEntradas(),
    );

    const { data: cuponConfig } = await this.configuracionCuponServicio.obtener();
    this.cuponConfig.set(cuponConfig ?? null);

    const { data: premios } = await this.premioServicio.listarActivas();
    this.premios.set(premios ?? []);
  }

  ngOnDestroy() {
    if (this.canalEntradas) {
      this.entradaServicio.desuscribir(this.canalEntradas);
    }

    this.reserva.destruir();
  }

  protected elegirPremio(id: string) {
    this.premioSeleccionado.update((actual) => (actual === id ? null : id));
  }

  protected irA(destino: PasoCompra) {
    if (puedeIrA(destino, this.pasoMaximo())) {
      this.paso.set(destino);
    }
  }

  private avanzarA(destino: PasoCompra) {
    this.paso.set(destino);
    this.pasoMaximo.update((maximo) => pasoMasAvanzado(maximo, destino));
  }

  protected async confirmarButacas() {
    if (
      this.reserva.seleccionadas().size === 0 ||
      this.enviando() ||
      this.reserva.sincronizando()
    ) {
      return;
    }

    this.enviando.set(true);
    const reservadas = await this.reserva.confirmar();
    this.enviando.set(false);

    if (reservadas) {
      this.avanzarA('candy');
    }
  }

  protected confirmarCandy() {
    this.avanzarA('pago');
  }

  protected async confirmarPago() {
    const funcion = this.funcion();

    if (!funcion || this.enviando() || !this.puedeConfirmarPago()) {
      return;
    }

    this.enviando.set(true);
    const codigo = generarCodigoCompra();
    const resultado = await this.procesoCompra.completar(this.armarPedido(funcion, codigo));

    if (!resultado) {
      await this.cargarCliente();
      this.enviando.set(false);
      return;
    }

    this.codigoCompra.set(codigo);
    this.qrDataUrl.set(resultado.qr);
    this.descuentoAplicado.set(resultado.descuentoCupon);
    this.creditoUsado.set(resultado.credito);
    this.mailEnviado.set(resultado.mailEnviado);
    this.enviando.set(false);
    this.avanzarA('listo');
  }

  private armarPedido(funcion: Funcion, codigo: string): PedidoCompra {
    return {
      codigo,
      funcion,
      pelicula: this.pelicula(),
      sala: this.sala(),
      butacas: this.reserva.elegidas(),
      candy: this.itemsCandy(),
      combos: this.itemsCombo(),
      total: this.total(),
      descuentoCupon: this.descuentoCupon(),
      premio: this.premioElegido(),
      credito: this.creditoAplicado(),
      usuarioId: this.auth.usuario()?.id ?? null,
      email: this.emailFinal(),
      edadDeclarada: this.edadParaGuardar(),
    };
  }
}
