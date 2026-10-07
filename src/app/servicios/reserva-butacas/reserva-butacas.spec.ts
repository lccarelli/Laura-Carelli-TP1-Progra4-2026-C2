import { TestBed } from '@angular/core/testing';
import { Butaca } from '../../interfaces/butaca';
import { Entrada } from '../../interfaces/entrada';
import { EntradaServicio } from '../entrada/entrada';
import { Errores } from '../errores/errores';
import { SalaServicio } from '../sala/sala';
import { ReservaButacas } from './reserva-butacas';

const SESION = 'sesion-propia';
const AHORA = new Date('2026-10-10T20:00:00Z');

const butaca = (id: string, tipo: Butaca['tipo'] = 'normal'): Butaca => ({
  id,
  sala_id: 's1',
  fila: 'A',
  numero: Number(id.slice(1)),
  bloque: 'centro',
  tipo,
});

const entrada = (datos: Partial<Entrada>): Entrada => ({
  id: 'e1',
  funcion_id: 'f1',
  butaca_id: 'b1',
  estado: 'reservada',
  reservada_hasta: null,
  codigo_compra: null,
  sesion_id: SESION,
  creada_en: '2026-10-10T19:50:00Z',
  validada_en: null,
  validada_por: null,
  ...datos,
});

const enMinutos = (minutos: number) => new Date(AHORA.getTime() + minutos * 60_000).toISOString();

describe('ReservaButacas', () => {
  let reserva: ReservaButacas;
  let errores: { mostrar: ReturnType<typeof vi.fn> };
  let entradaServicio: {
    sesionId: ReturnType<typeof vi.fn>;
    listarPorFuncion: ReturnType<typeof vi.fn>;
    reservar: ReturnType<typeof vi.fn>;
    suscribirCambios: ReturnType<typeof vi.fn>;
    desuscribir: ReturnType<typeof vi.fn>;
  };
  let salaServicio: { listarButacas: ReturnType<typeof vi.fn> };
  let alCambiar: () => void;

  const cargar = () => reserva.cargar('f1', 's1');
  const actualizar = async () => {
    TestBed.tick();
    await Promise.resolve();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);

    errores = { mostrar: vi.fn() };
    salaServicio = {
      listarButacas: vi.fn().mockResolvedValue({ data: [butaca('b1'), butaca('b2')], error: null }),
    };
    entradaServicio = {
      sesionId: vi.fn().mockReturnValue(SESION),
      listarPorFuncion: vi.fn().mockResolvedValue({ data: [], error: null }),
      reservar: vi.fn().mockResolvedValue({ error: null }),
      suscribirCambios: vi.fn().mockImplementation((_funcionId, callback) => {
        alCambiar = callback;
        return 'canal';
      }),
      desuscribir: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ReservaButacas,
        { provide: EntradaServicio, useValue: entradaServicio },
        { provide: SalaServicio, useValue: salaServicio },
        { provide: Errores, useValue: errores },
      ],
    });
    reserva = TestBed.inject(ReservaButacas);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('cargar', () => {
    it('trae las butacas de la sala y las entradas de la función', async () => {
      const ocupada = entrada({ butaca_id: 'b2', sesion_id: 'otra' });
      entradaServicio.listarPorFuncion.mockResolvedValue({ data: [ocupada], error: null });

      await cargar();

      expect(salaServicio.listarButacas).toHaveBeenCalledWith('s1');
      expect(entradaServicio.listarPorFuncion).toHaveBeenCalledWith('f1');
      expect(reserva.butacas().map((b) => b.id)).toEqual(['b1', 'b2']);
      expect(reserva.entradas()).toEqual([ocupada]);
    });

    it('se suscribe a los cambios de la función', async () => {
      await cargar();

      expect(entradaServicio.suscribirCambios).toHaveBeenCalledWith('f1', expect.any(Function));
    });

    it('muestra el error si fallan las butacas y no las carga', async () => {
      salaServicio.listarButacas.mockResolvedValue({ data: null, error: { message: 'sin sala' } });

      await cargar();

      expect(errores.mostrar).toHaveBeenCalledWith('sin sala');
      expect(reserva.butacas()).toEqual([]);
    });

    it('muestra el error si fallan las entradas', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: null,
        error: { message: 'sin conexión', code: '500' },
      });

      await cargar();

      expect(errores.mostrar).toHaveBeenCalledWith('sin conexión');
    });

    it('ignora que la tabla de entradas todavía no exista', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: null,
        error: { message: 'no existe', code: 'PGRST205' },
      });

      await cargar();

      expect(errores.mostrar).not.toHaveBeenCalled();
      expect(reserva.entradas()).toEqual([]);
    });

    it('recarga las entradas cuando el canal avisa un cambio', async () => {
      await cargar();
      const nueva = entrada({ butaca_id: 'b2', sesion_id: 'otra' });
      entradaServicio.listarPorFuncion.mockResolvedValue({ data: [nueva], error: null });

      alCambiar();
      await vi.advanceTimersByTimeAsync(0);

      expect(reserva.entradas()).toEqual([nueva]);
    });

    it('conserva las entradas si la recarga falla', async () => {
      const inicial = entrada({});
      entradaServicio.listarPorFuncion.mockResolvedValue({ data: [inicial], error: null });
      await cargar();
      entradaServicio.listarPorFuncion.mockResolvedValue({ data: null, error: { message: 'x' } });

      alCambiar();
      await vi.advanceTimersByTimeAsync(0);

      expect(reserva.entradas()).toEqual([inicial]);
    });
  });

  describe('alternar', () => {
    beforeEach(async () => {
      await cargar();
    });

    it('elige una butaca y la reserva', async () => {
      await reserva.alternar('b1');

      expect([...reserva.seleccionadas()]).toEqual(['b1']);
      expect(entradaServicio.reservar).toHaveBeenCalledWith('f1', ['b1']);
    });

    it('suma otra butaca a la selección', async () => {
      await reserva.alternar('b1');
      await reserva.alternar('b2');

      expect(entradaServicio.reservar).toHaveBeenLastCalledWith('f1', ['b1', 'b2']);
    });

    it('quita una butaca ya elegida', async () => {
      await reserva.alternar('b1');
      await reserva.alternar('b2');
      await reserva.alternar('b1');

      expect([...reserva.seleccionadas()]).toEqual(['b2']);
      expect(entradaServicio.reservar).toHaveBeenLastCalledWith('f1', ['b2']);
    });

    it('devuelve la selección anterior y muestra el error si no se pudo reservar', async () => {
      await reserva.alternar('b1');
      entradaServicio.reservar.mockResolvedValue({ error: 'Alguien más la reservó' });

      await reserva.alternar('b2');

      expect([...reserva.seleccionadas()]).toEqual(['b1']);
      expect(errores.mostrar).toHaveBeenCalledWith('Alguien más la reservó');
    });

    it('marca que está sincronizando mientras espera la respuesta', async () => {
      let responder!: (valor: { error: null }) => void;
      entradaServicio.reservar.mockReturnValue(new Promise((resolver) => (responder = resolver)));

      const pendiente = reserva.alternar('b1');

      expect(reserva.sincronizando()).toBe(true);

      responder({ error: null });
      await pendiente;

      expect(reserva.sincronizando()).toBe(false);
    });

    it('ignora un toque mientras todavía sincroniza el anterior', async () => {
      let responder!: (valor: { error: null }) => void;
      entradaServicio.reservar.mockReturnValue(new Promise((resolver) => (responder = resolver)));

      const primero = reserva.alternar('b1');
      await reserva.alternar('b2');
      responder({ error: null });
      await primero;

      expect([...reserva.seleccionadas()]).toEqual(['b1']);
      expect(entradaServicio.reservar).toHaveBeenCalledTimes(1);
    });

    it('no hace nada si todavía no se cargó una función', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ReservaButacas,
          { provide: EntradaServicio, useValue: entradaServicio },
          { provide: SalaServicio, useValue: salaServicio },
          { provide: Errores, useValue: errores },
        ],
      });
      const sinCargar = TestBed.inject(ReservaButacas);
      entradaServicio.reservar.mockClear();

      await sinCargar.alternar('b1');

      expect(entradaServicio.reservar).not.toHaveBeenCalled();
      expect(sinCargar.seleccionadas().size).toBe(0);
    });
  });

  describe('elegidas', () => {
    it('son las butacas de la sala que están seleccionadas', async () => {
      await cargar();

      await reserva.alternar('b2');

      expect(reserva.elegidas().map((b) => b.id)).toEqual(['b2']);
    });
  });

  describe('confirmar', () => {
    beforeEach(async () => {
      await cargar();
    });

    it('es false sin butacas elegidas y no consulta nada', async () => {
      entradaServicio.reservar.mockClear();

      expect(await reserva.confirmar()).toBe(false);
      expect(entradaServicio.reservar).not.toHaveBeenCalled();
    });

    it('reserva las butacas elegidas y devuelve true', async () => {
      await reserva.alternar('b1');
      entradaServicio.reservar.mockClear();

      expect(await reserva.confirmar()).toBe(true);
      expect(entradaServicio.reservar).toHaveBeenCalledWith('f1', ['b1']);
    });

    it('devuelve false y muestra el error si la reserva falla', async () => {
      await reserva.alternar('b1');
      entradaServicio.reservar.mockResolvedValue({ error: 'La reserva venció' });

      expect(await reserva.confirmar()).toBe(false);
      expect(errores.mostrar).toHaveBeenCalledWith('La reserva venció');
    });
  });

  describe('reservas propias y tiempo restante', () => {
    it('propias sólo incluye reservas de esta sesión', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: [
          entrada({ id: 'e1', butaca_id: 'b1', reservada_hasta: enMinutos(5) }),
          entrada({ id: 'e2', butaca_id: 'b2', sesion_id: 'otra', reservada_hasta: enMinutos(5) }),
          entrada({ id: 'e3', butaca_id: 'b3', estado: 'vendida' }),
        ],
        error: null,
      });

      await cargar();

      expect([...reserva.propias()]).toEqual(['b1']);
    });

    it('no hay tiempo restante sin reservas propias', async () => {
      await cargar();

      expect(reserva.tiempoRestanteTexto()).toBeNull();
    });

    it('cuenta hasta la reserva que vence primero', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: [
          entrada({ id: 'e1', butaca_id: 'b1', reservada_hasta: enMinutos(9) }),
          entrada({ id: 'e2', butaca_id: 'b2', reservada_hasta: enMinutos(4) }),
        ],
        error: null,
      });

      await cargar();
      await actualizar();

      expect(reserva.tiempoRestanteTexto()).toBe('4:00');
    });

    it('descuenta de a un segundo', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: [entrada({ reservada_hasta: enMinutos(1) })],
        error: null,
      });
      await cargar();
      await actualizar();

      await vi.advanceTimersByTimeAsync(1000);

      expect(reserva.tiempoRestanteTexto()).toBe('0:59');
    });

    it('no baja de 0:00 cuando la reserva ya venció', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: [entrada({ reservada_hasta: enMinutos(-2) })],
        error: null,
      });

      await cargar();
      await actualizar();

      expect(reserva.tiempoRestanteTexto()).toBe('0:00');
    });

    it('no deja un reloj corriendo si no hay reservas propias', async () => {
      await cargar();
      await actualizar();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('al destruirse', () => {
    it('cancela la suscripción a los cambios', async () => {
      await cargar();

      TestBed.resetTestingModule();

      expect(entradaServicio.desuscribir).toHaveBeenCalledWith('canal');
    });

    it('no cancela nada si nunca se suscribió', () => {
      TestBed.resetTestingModule();

      expect(entradaServicio.desuscribir).not.toHaveBeenCalled();
    });

    it('detiene el reloj', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: [entrada({ reservada_hasta: enMinutos(5) })],
        error: null,
      });
      await cargar();
      await actualizar();
      expect(vi.getTimerCount()).toBe(1);

      TestBed.resetTestingModule();

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
