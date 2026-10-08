import { TestBed } from '@angular/core/testing';
import { Supabase } from '../supabase/supabase';
import { CompraCandyServicio } from './compra-candy';

describe('CompraCandyServicio', () => {
  let servicio: CompraCandyServicio;
  let rpc: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rpc = vi.fn().mockResolvedValue({ data: 2, error: null });
    TestBed.configureTestingModule({
      providers: [CompraCandyServicio, { provide: Supabase, useValue: { Supabase: { rpc } } }],
    });
    servicio = TestBed.inject(CompraCandyServicio);
  });

  describe('entregarPendientes', () => {
    it('llama a entregar_pendientes_candy con el código de la compra', async () => {
      await servicio.entregarPendientes('ABCD2345');

      expect(rpc).toHaveBeenCalledWith('entregar_pendientes_candy', {
        codigo_compra_param: 'ABCD2345',
      });
    });

    it('devuelve lo que responde la base, por ejemplo el rechazo de un segundo uso', async () => {
      rpc.mockResolvedValue({ error: { message: 'Este candy ya fue retirado.' } });

      expect(await servicio.entregarPendientes('ABCD2345')).toEqual({
        error: { message: 'Este candy ya fue retirado.' },
      });
    });
  });
});
