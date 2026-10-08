import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { PeliculaServicio } from '../pelicula/pelicula';
import { SalaServicio } from '../sala/sala';
import { Supabase } from '../supabase/supabase';
import { FuncionServicio } from './funcion';

describe('FuncionServicio', () => {
  let servicio: FuncionServicio;
  let rpc: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    rpc = vi.fn().mockResolvedValue({ data: { eliminadas: 0, conservadas: 0 }, error: null });

    TestBed.configureTestingModule({
      providers: [
        FuncionServicio,
        DatePipe,
        { provide: PeliculaServicio, useValue: {} },
        { provide: SalaServicio, useValue: {} },
        { provide: Supabase, useValue: { Supabase: { rpc } } },
      ],
    });
    servicio = TestBed.inject(FuncionServicio);
  });

  describe('eliminarVarias', () => {
    it('manda todos los ids juntos a la función eliminar_funciones', async () => {
      await servicio.eliminarVarias(['a', 'b', 'c']);

      expect(rpc).toHaveBeenCalledTimes(1);
      expect(rpc).toHaveBeenCalledWith('eliminar_funciones', { funcion_ids: ['a', 'b', 'c'] });
    });

    it('no llama a la base si no hay ids', async () => {
      const resultado = await servicio.eliminarVarias([]);

      expect(rpc).not.toHaveBeenCalled();
      expect(resultado).toEqual({ eliminadas: 0, conservadas: 0 });
    });

    it('devuelve cuántas se eliminaron y cuántas se conservaron', async () => {
      rpc.mockResolvedValue({ data: { eliminadas: 2, conservadas: 1 }, error: null });

      const resultado = await servicio.eliminarVarias(['a', 'b', 'c']);

      expect(resultado).toEqual({ eliminadas: 2, conservadas: 1 });
    });

    it('devuelve el error de la base, por ejemplo el de permisos', async () => {
      rpc.mockResolvedValue({ data: null, error: { message: 'No tenés permiso' } });

      const resultado = await servicio.eliminarVarias(['a']);

      expect(resultado.error?.message).toBe('No tenés permiso');
      expect(resultado.eliminadas).toBe(0);
    });

    it('devuelve un error si la base no responde nada', async () => {
      rpc.mockResolvedValue({ data: null, error: null });

      const resultado = await servicio.eliminarVarias(['a']);

      expect(resultado.error?.message).toBe('No se pudieron eliminar las funciones.');
    });
  });

  describe('eliminarDePelicula', () => {
    it('pide a la base eliminar las funciones de esa película', async () => {
      rpc.mockResolvedValue({ data: { eliminadas: 4, conservadas: 0 }, error: null });

      const resultado = await servicio.eliminarDePelicula('p1');

      expect(rpc).toHaveBeenCalledWith('eliminar_funciones_de_pelicula', {
        pelicula_id_param: 'p1',
      });
      expect(resultado).toEqual({ eliminadas: 4, conservadas: 0 });
    });

    it('devuelve el error si falla', async () => {
      rpc.mockResolvedValue({ data: null, error: { message: 'caído' } });

      const resultado = await servicio.eliminarDePelicula('p1');

      expect(resultado.error?.message).toBe('caído');
    });
  });
});
