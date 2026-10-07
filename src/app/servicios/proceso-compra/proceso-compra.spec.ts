import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Butaca } from '../../interfaces/butaca';
import { Combo } from '../../interfaces/combo';
import { Funcion } from '../../interfaces/funcion';
import { Pelicula } from '../../interfaces/pelicula';
import { Premio } from '../../interfaces/premio';
import { ProductoCandy } from '../../interfaces/producto-candy';
import { CompraServicio } from '../compra/compra';
import { EntradaServicio } from '../entrada/entrada';
import { Errores } from '../errores/errores';
import { Flujo } from '../logger/flujo';
import { Logger } from '../logger/logger';
import { TipoEvento } from '../logger/tipo-evento';
import { PedidoCompra, ProcesoCompra } from './proceso-compra';

const FUNCION = {
  id: 'f1',
  inicio: '2026-10-10T20:30:00Z',
  formato: '3d',
  idioma: 'castellano',
} as Funcion;

const PELICULA = {
  nombre: 'Matrix',
  imagen_url: 'matrix.png',
  restriccion_edad: 16,
} as Pelicula;

const PREMIO = { id: 'pr1', nombre: 'Entrada gratis', monto_descuento: 4000 } as Premio;

const pedido = (datos: Partial<PedidoCompra> = {}): PedidoCompra => ({
  codigo: 'ABCD2345',
  funcion: FUNCION,
  pelicula: PELICULA,
  sala: 'Sala 1',
  butacas: [{ id: 'b1', fila: 'A', numero: 3, tipo: 'normal' } as Butaca],
  candy: [{ producto: { id: 'p1', nombre: 'Pochoclo' } as ProductoCandy, cantidad: 2 }],
  combos: [{ combo: { id: 'c1', nombre: 'Combo Clásico' } as Combo, cantidad: 1 }],
  total: 10000,
  descuentoCupon: 0,
  premio: null,
  credito: 0,
  usuarioId: null,
  email: 'compra@mail.com',
  edadDeclarada: 21,
  ...datos,
});

describe('ProcesoCompra', () => {
  let proceso: ProcesoCompra;
  let compraServicio: Record<string, ReturnType<typeof vi.fn>>;
  let errores: { mostrar: ReturnType<typeof vi.fn> };
  let logger: { registrar: ReturnType<typeof vi.fn> };

  const enviadoAlServidor = () => compraServicio['confirmar'].mock.calls[0][0];

  beforeEach(() => {
    compraServicio = {
      confirmar: vi.fn().mockResolvedValue({ error: null }),
      enviarQrPorMail: vi.fn().mockResolvedValue({ error: null }),
      enviarPushCompraConfirmada: vi.fn().mockResolvedValue({ error: null }),
    };
    errores = { mostrar: vi.fn() };
    logger = { registrar: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ProcesoCompra,
        DatePipe,
        { provide: CompraServicio, useValue: compraServicio },
        { provide: EntradaServicio, useValue: { sesionId: () => 'sesion-1' } },
        { provide: Errores, useValue: errores },
        { provide: Logger, useValue: logger },
      ],
    });
    proceso = TestBed.inject(ProcesoCompra);
  });

  describe('confirmación en el servidor', () => {
    it('manda todo junto: entradas, datos de la compra, candy y combos', async () => {
      await proceso.completar(pedido());

      expect(compraServicio['confirmar']).toHaveBeenCalledTimes(1);
      expect(enviadoAlServidor()).toEqual({
        codigo: 'ABCD2345',
        funcionId: 'f1',
        butacaIds: ['b1'],
        sesionId: 'sesion-1',
        email: 'compra@mail.com',
        edadDeclarada: 21,
        total: 10000,
        descuentoCupon: 0,
        premioId: null,
        credito: 0,
        candy: [{ producto_candy_id: 'p1', cantidad: 2 }],
        combos: [{ combo_id: 'c1', cantidad: 1 }],
      });
    });

    it('manda el total ya descontado: cupón, premio y crédito', async () => {
      await proceso.completar(pedido({ descuentoCupon: 1500, premio: PREMIO, credito: 1000 }));

      expect(enviadoAlServidor()).toMatchObject({
        total: 3500,
        descuentoCupon: 1500,
        premioId: 'pr1',
        credito: 1000,
      });
    });

    it('nunca manda un total negativo', async () => {
      await proceso.completar(pedido({ descuentoCupon: 9000, premio: PREMIO, credito: 0 }));

      expect(enviadoAlServidor().total).toBe(0);
    });
  });

  describe('si el servidor rechaza la compra', () => {
    beforeEach(() => {
      compraServicio['confirmar'].mockResolvedValue({
        error: { message: 'La reserva venció. Volvé a elegir las butacas.' },
      });
    });

    it('devuelve null', async () => {
      expect(await proceso.completar(pedido())).toBeNull();
    });

    it('muestra el mensaje y lo registra en el log', async () => {
      await proceso.completar(pedido());

      expect(errores.mostrar).toHaveBeenCalledWith(
        'La reserva venció. Volvé a elegir las butacas.',
      );
      expect(logger.registrar).toHaveBeenCalledWith(
        Flujo.AltaCompra,
        TipoEvento.Error,
        'La reserva venció. Volvé a elegir las butacas.',
      );
    });

    it('no genera QR, ni manda mail ni push, ni registra éxito', async () => {
      await proceso.completar(pedido({ usuarioId: 'u1' }));

      expect(compraServicio['enviarQrPorMail']).not.toHaveBeenCalled();
      expect(compraServicio['enviarPushCompraConfirmada']).not.toHaveBeenCalled();
      expect(logger.registrar).not.toHaveBeenCalledWith(
        Flujo.AltaCompra,
        TipoEvento.Exito,
        expect.anything(),
      );
    });
  });

  describe('mail', () => {
    it('informa el total cobrado y el cupón en el mail', async () => {
      await proceso.completar(pedido({ descuentoCupon: 1500, credito: 500 }));

      expect(compraServicio['enviarQrPorMail'].mock.calls[0][0]).toMatchObject({
        total: 8000,
        descuentoCupon: 1500,
      });
    });

    it('informa mailEnviado false si el envío falla, sin deshacer la compra', async () => {
      compraServicio['enviarQrPorMail'].mockResolvedValue({ error: { message: 'x' } });

      const resultado = await proceso.completar(pedido());

      expect(resultado?.mailEnviado).toBe(false);
      expect(logger.registrar).toHaveBeenCalledWith(Flujo.AltaCompra, TipoEvento.Exito, 'ABCD2345');
    });

    it('usa "Sin restricción" y valores vacíos si no hay datos de la película', async () => {
      await proceso.completar(pedido({ pelicula: null }));

      expect(compraServicio['enviarQrPorMail'].mock.calls[0][0]).toMatchObject({
        restriccionTexto: 'Sin restricción',
        peliculaNombre: '',
        posterUrl: null,
      });
    });
  });

  describe('push', () => {
    it('no manda push si no hay usuario', async () => {
      await proceso.completar(pedido());

      expect(compraServicio['enviarPushCompraConfirmada']).not.toHaveBeenCalled();
    });

    it('avisa con el nombre de la película y el código', async () => {
      await proceso.completar(pedido({ usuarioId: 'u1' }));

      expect(compraServicio['enviarPushCompraConfirmada']).toHaveBeenCalledWith(
        'u1',
        'Matrix',
        'ABCD2345',
      );
    });

    it('registra el error de push sin romper la compra', async () => {
      compraServicio['enviarPushCompraConfirmada'].mockResolvedValue({
        error: { message: 'push' },
      });

      const resultado = await proceso.completar(pedido({ usuarioId: 'u1' }));

      expect(logger.registrar).toHaveBeenCalledWith(
        Flujo.AvisoPushCompra,
        TipoEvento.Error,
        'push',
      );
      expect(resultado).not.toBeNull();
    });
  });
});
