import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toDataURL } from 'qrcode';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../servicios/sala/sala';
import { EntradaServicio } from '../../../servicios/entrada/entrada';
import { ProductoCandyServicio } from '../../../servicios/producto-candy/producto-candy';
import { CompraCandyServicio } from '../../../servicios/compra-candy/compra-candy';
import { CompraServicio } from '../../../servicios/compra/compra';
import { Auth } from '../../../servicios/auth/auth';
import { Errores } from '../../../servicios/errores/errores';
import { Funcion } from '../../../interfaces/funcion';
import { Pelicula } from '../../../interfaces/pelicula';
import { Butaca } from '../../../interfaces/butaca';
import { Entrada } from '../../../interfaces/entrada';
import { ProductoCandy } from '../../../interfaces/producto-candy';
import { Boton } from '../../../componentes/boton/boton';
import { BotonLink } from '../../../componentes/boton-link/boton-link';
import { MapaButacas } from '../../../componentes/mapa-butacas/mapa-butacas';
import { Poster } from '../../../componentes/poster/poster';
import { RestriccionEdadPipe } from '../../../pipes/restriccion-edad/restriccion-edad';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';

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

const BLOQUES: Butaca['bloque'][] = ['izquierdo', 'centro', 'derecho'];

function generarImagenButacas(butacas: Butaca[], seleccionadas: Set<string>): string | null {
  const filasConSeleccion = [
    ...new Set(butacas.filter((b) => seleccionadas.has(b.id)).map((b) => b.fila)),
  ].sort();

  if (filasConSeleccion.length === 0) {
    return null;
  }

  const ANCHO_CELDA = 24;
  const ALTO_CELDA = 24;
  const GAP_CELDA = 4;
  const GAP_BLOQUE = 16;
  const PADDING = 14;
  const ANCHO_ETIQUETA = 26;

  const filas = filasConSeleccion.map((fila) => ({
    fila,
    bloques: BLOQUES.map((bloque) =>
      butacas
        .filter((b) => b.fila === fila && b.bloque === bloque)
        .sort((a, b) => a.numero - b.numero),
    ),
  }));

  const anchoDeFila = (bloques: Butaca[][]) =>
    bloques.reduce(
      (acumulado, bloque) => acumulado + bloque.length * (ANCHO_CELDA + GAP_CELDA),
      0,
    ) +
    GAP_BLOQUE * (bloques.length - 1);

  const anchoMaximo = Math.max(...filas.map((f) => anchoDeFila(f.bloques)));
  const ancho = PADDING * 2 + ANCHO_ETIQUETA + anchoMaximo;
  const alto = PADDING * 2 + filas.length * (ALTO_CELDA + GAP_CELDA);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);

  filas.forEach((filaInfo, indice) => {
    const y = PADDING + indice * (ALTO_CELDA + GAP_CELDA);

    ctx.fillStyle = '#131313';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(filaInfo.fila, PADDING, y + ALTO_CELDA - 7);

    let x = PADDING + ANCHO_ETIQUETA;

    filaInfo.bloques.forEach((bloque, indiceBloque) => {
      for (const butaca of bloque) {
        const elegida = seleccionadas.has(butaca.id);
        ctx.fillStyle = elegida ? '#131313' : '#ffffff';
        ctx.strokeStyle = '#131313';
        ctx.lineWidth = 1.5;
        ctx.fillRect(x, y, ANCHO_CELDA, ALTO_CELDA);
        ctx.strokeRect(x, y, ANCHO_CELDA, ALTO_CELDA);

        if (elegida) {
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(butaca.numero), x + ANCHO_CELDA / 2, y + ALTO_CELDA / 2 + 4);
          ctx.textAlign = 'left';
        }

        x += ANCHO_CELDA + GAP_CELDA;
      }

      if (indiceBloque < filaInfo.bloques.length - 1) {
        x += GAP_BLOQUE;
      }
    });
  });

  return canvas.toDataURL('image/png');
}

function quitarPrefijoBase64(dataUrl: string): string {
  const indice = dataUrl.indexOf(',');
  return indice === -1 ? dataUrl : dataUrl.slice(indice + 1);
}

@Component({
  imports: [Boton, BotonLink, MapaButacas, Poster, DatePipe, UpperCasePipe, RestriccionEdadPipe],
  selector: 'app-detalle-funcion',
  styleUrl: './detalle.css',
  templateUrl: './detalle.html',
})
export class Detalle {
  private route = inject(ActivatedRoute);
  private funcionServicio = inject(FuncionServicio);
  private peliculaServicio = inject(PeliculaServicio);
  private salaServicio = inject(SalaServicio);
  private entradaServicio = inject(EntradaServicio);
  private productoCandyServicio = inject(ProductoCandyServicio);
  private compraCandyServicio = inject(CompraCandyServicio);
  private compraServicio = inject(CompraServicio);
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

  protected paso = signal<Paso>('butacas');
  protected pasoMaximo = signal<Paso>('butacas');
  protected enviando = signal(false);
  protected butacasSeleccionadas = signal<Set<string>>(new Set());
  protected cantidadCandy = signal<Map<string, number>>(new Map());
  protected codigoCompra = signal<string | null>(null);
  protected qrDataUrl = signal<string | null>(null);
  protected emailAnonimo = signal('');
  protected edadAnonima = signal<number | null>(null);
  protected mailEnviado = signal<boolean | null>(null);

  protected butacasElegidas = computed(() =>
    this.butacas().filter((butaca) => this.butacasSeleccionadas().has(butaca.id)),
  );

  protected subtotalButacas = computed(() =>
    this.butacasElegidas().reduce(
      (acumulado, butaca) => acumulado + PRECIO_POR_TIPO[butaca.tipo],
      0,
    ),
  );

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

  protected total = computed(() => this.subtotalButacas() + this.subtotalCandy());

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
    ] = await Promise.all([
      this.peliculaServicio.buscarPorId(data.pelicula_id),
      this.salaServicio.listar(),
      this.salaServicio.listarButacas(data.sala_id),
      this.productoCandyServicio.listarActivos(),
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

    const { data: entradas, error: errorEntradas } =
      await this.entradaServicio.listarPorFuncion(id);

    if (errorEntradas && errorEntradas.code !== TABLA_NO_ENCONTRADA) {
      this.errores.mostrar(errorEntradas.message);
    } else {
      this.entradas.set(entradas ?? []);
    }
  }

  protected irA(destino: Paso) {
    if (ORDEN_PASOS.indexOf(destino) <= ORDEN_PASOS.indexOf(this.pasoMaximo())) {
      this.paso.set(destino);
    }
  }

  protected alternarButaca(butacaId: string) {
    const seleccionadas = new Set(this.butacasSeleccionadas());

    if (seleccionadas.has(butacaId)) {
      seleccionadas.delete(butacaId);
    } else {
      seleccionadas.add(butacaId);
    }

    this.butacasSeleccionadas.set(seleccionadas);
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

    if (!funcion || this.butacasSeleccionadas().size === 0 || this.enviando()) {
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

    const email = this.emailFinal();
    const { error: errorCompra } = await this.compraServicio.crear({
      codigo_compra: codigo,
      funcion_id: funcion.id,
      cliente_id: this.auth.usuario()?.id ?? null,
      email,
      edad_declarada: this.edadParaGuardar(),
      total: this.total(),
    });

    if (errorCompra) {
      this.logger.registrar(Flujo.AltaCompra, TipoEvento.Error, errorCompra.message);
      this.errores.mostrar(errorCompra.message);
    }

    this.codigoCompra.set(codigo);
    const qr = await toDataURL(codigo);
    this.qrDataUrl.set(qr);

    const pelicula = this.pelicula();
    const imagenButacas = generarImagenButacas(this.butacas(), new Set(butacaIds));

    const { error: errorMail } = await this.compraServicio.enviarQrPorMail({
      email,
      codigoCompra: codigo,
      qrBase64: quitarPrefijoBase64(qr),
      butacasImagenBase64: imagenButacas ? quitarPrefijoBase64(imagenButacas) : null,
      posterUrl: pelicula?.imagen_url ?? null,
      peliculaNombre: pelicula?.nombre ?? '',
      restriccionTexto: new RestriccionEdadPipe().transform(pelicula?.restriccion_edad ?? null),
      sala: this.sala(),
      diaHora: this.datePipe.transform(funcion.inicio, 'EEEE dd/MM/yyyy HH:mm') ?? '',
      formato: funcion.formato,
      idioma: funcion.idioma,
      butacasTexto: this.butacasElegidas().map((b) => `${b.fila}${b.numero} (${b.tipo})`),
      candyTexto: this.itemsCandy().map((item) => `${item.cantidad}x ${item.producto.nombre}`),
      total: this.total(),
    });
    this.mailEnviado.set(!errorMail);

    this.logger.registrar(Flujo.AltaCompra, TipoEvento.Exito, codigo);
    this.enviando.set(false);
    this.avanzarA('listo');
  }

  descargarComprobante() {
    window.print();
  }
}
