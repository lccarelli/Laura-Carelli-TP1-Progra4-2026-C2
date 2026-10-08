import { TestBed } from '@angular/core/testing';
import { CompraPorConfirmar } from '../../interfaces/compra-por-confirmar';
import { Supabase } from '../supabase/supabase';
import { CompraServicio } from './compra';

const COMPRA: CompraPorConfirmar = {
  codigo: 'ABCD2345',
  funcionId: 'f1',
  butacaIds: ['b1', 'b2'],
  sesionId: 'sesion-1',
  email: 'compra@mail.com',
  edadDeclarada: 21,
  total: 8500,
  descuentoCupon: 1500,
  premioId: 'pr1',
  credito: 500,
  candy: [{ producto_candy_id: 'p1', cantidad: 2 }],
  combos: [{ combo_id: 'c1', cantidad: 1 }],
};

describe('CompraServicio', () => {
  let servicio: CompraServicio;
  let rpc: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rpc = vi.fn().mockResolvedValue({ error: null });
    TestBed.configureTestingModule({
      providers: [CompraServicio, { provide: Supabase, useValue: { Supabase: { rpc } } }],
    });
    servicio = TestBed.inject(CompraServicio);
  });

  describe('confirmar', () => {
    it('llama a la función confirmar_compra con los nombres de parámetros de la base', async () => {
      await servicio.confirmar(COMPRA);

      expect(rpc).toHaveBeenCalledWith('confirmar_compra', {
        codigo_param: 'ABCD2345',
        funcion_id_param: 'f1',
        butaca_ids: ['b1', 'b2'],
        sesion_id_param: 'sesion-1',
        email_param: 'compra@mail.com',
        edad_declarada_param: 21,
        total_param: 8500,
        descuento_cupon_param: 1500,
        premio_id_param: 'pr1',
        credito_param: 500,
        candy_param: [{ producto_candy_id: 'p1', cantidad: 2 }],
        combos_param: [{ combo_id: 'c1', cantidad: 1 }],
      });
    });

    it('devuelve lo que responde la base', async () => {
      rpc.mockResolvedValue({ error: { message: 'La reserva venció.' } });

      expect(await servicio.confirmar(COMPRA)).toEqual({
        error: { message: 'La reserva venció.' },
      });
    });
  });

  describe('enviarPushDeUso', () => {
    let invoke: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      invoke = vi.fn().mockResolvedValue({ error: null });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CompraServicio,
          { provide: Supabase, useValue: { Supabase: { functions: { invoke } } } },
        ],
      });
      servicio = TestBed.inject(CompraServicio);
    });

    it('invoca enviar-push-uso con el código y el tipo de uso', async () => {
      await servicio.enviarPushDeUso('ABCD2345', 'entrada');

      expect(invoke).toHaveBeenCalledWith('enviar-push-uso', {
        body: { codigoCompra: 'ABCD2345', tipo: 'entrada' },
      });
    });

    it('sirve también para el retiro de candy', async () => {
      await servicio.enviarPushDeUso('ABCD2345', 'candy');

      expect(invoke).toHaveBeenCalledWith('enviar-push-uso', {
        body: { codigoCompra: 'ABCD2345', tipo: 'candy' },
      });
    });
  });
});
