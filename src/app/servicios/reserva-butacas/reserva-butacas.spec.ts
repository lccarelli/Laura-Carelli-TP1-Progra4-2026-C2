import { Butaca } from '../../interfaces/butaca';
import { Entrada } from '../../interfaces/entrada';
import { CambioDeEntrada, EntradaServicio } from '../entrada/entrada';
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

const insercion = (nueva: Entrada) =>
  ({ eventType: 'INSERT', new: nueva, old: {} }) as CambioDeEntrada;
const actualizacion = (nueva: Entrada) =>
  ({ eventType: 'UPDATE', new: nueva, old: { id: nueva.id } }) as CambioDeEntrada;
const baja = (id: string | undefined) =>
  ({ eventType: 'DELETE', new: {}, old: id ? { id } : {} }) as CambioDeEntrada;

describe('ReservaButacas', () => {
  let reserva: ReservaButacas;
  let errores: { mostrar: ReturnType<typeof vi.fn> };
  let entradaServicio: {
    sesionId: ReturnType<typeof vi.fn>;
    listarPorFuncion: ReturnType<typeof vi.fn>;
    reservar: ReturnType<typeof vi.fn>;
  };
  let salaServicio: { listarButacas: ReturnType<typeof vi.fn> };

  const cargar = () => reserva.cargar('f1', 's1');

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
    };

    reserva = new ReservaButacas(
      entradaServicio as unknown as EntradaServicio,
      salaServicio as unknown as SalaServicio,
      errores as unknown as Errores,
    );
  });

  afterEach(() => {
    reserva.destruir();
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
  });

  describe('aplicarCambio', () => {
    beforeEach(async () => {
      await cargar();
    });

    it('agrega la entrada de un INSERT', () => {
      const nueva = entrada({ id: 'e2', butaca_id: 'b2', sesion_id: 'otra' });

      reserva.aplicarCambio(insercion(nueva));

      expect(reserva.entradas()).toEqual([nueva]);
    });

    it('reemplaza la entrada de un UPDATE', () => {
      reserva.aplicarCambio(insercion(entrada({ id: 'e2', butaca_id: 'b2', sesion_id: 'otra' })));
      const vendida = entrada({ id: 'e2', butaca_id: 'b2', sesion_id: 'otra', estado: 'vendida' });

      reserva.aplicarCambio(actualizacion(vendida));

      expect(reserva.entradas()).toEqual([vendida]);
    });

    it('quita la entrada de un DELETE', () => {
      reserva.aplicarCambio(insercion(entrada({ id: 'e2', butaca_id: 'b2', sesion_id: 'otra' })));

      reserva.aplicarCambio(baja('e2'));

      expect(reserva.entradas()).toEqual([]);
    });

    it('ignora un DELETE sin id', () => {
      reserva.aplicarCambio(insercion(entrada({ id: 'e2', butaca_id: 'b2' })));

      reserva.aplicarCambio(baja(undefined));

      expect(reserva.entradas()).toHaveLength(1);
    });

    it('no duplica la entrada si el mismo INSERT llega dos veces', () => {
      const nueva = entrada({ id: 'e2', butaca_id: 'b2' });

      reserva.aplicarCambio(insercion(nueva));
      reserva.aplicarCambio(insercion(nueva));

      expect(reserva.entradas()).toHaveLength(1);
    });
  });

  describe('recargarEntradas', () => {
    it('vuelve a pedir las entradas y reemplaza la lista', async () => {
      await cargar();
      const nueva = entrada({ butaca_id: 'b2', sesion_id: 'otra' });
      entradaServicio.listarPorFuncion.mockResolvedValue({ data: [nueva], error: null });

      await reserva.recargarEntradas();

      expect(reserva.entradas()).toEqual([nueva]);
    });

    it('conserva las entradas si la recarga falla', async () => {
      const inicial = entrada({});
      entradaServicio.listarPorFuncion.mockResolvedValue({ data: [inicial], error: null });
      await cargar();
      entradaServicio.listarPorFuncion.mockResolvedValue({ data: null, error: { message: 'x' } });

      await reserva.recargarEntradas();

      expect(reserva.entradas()).toEqual([inicial]);
    });

    it('no pide nada si todavía no se cargó una función', async () => {
      await reserva.recargarEntradas();

      expect(entradaServicio.listarPorFuncion).not.toHaveBeenCalled();
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
      const sinCargar = new ReservaButacas(
        entradaServicio as unknown as EntradaServicio,
        salaServicio as unknown as SalaServicio,
        errores as unknown as Errores,
      );

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

    it('vuelve a pedir las entradas para quedar al día con la base', async () => {
      await reserva.alternar('b1');
      entradaServicio.listarPorFuncion.mockClear();

      await reserva.confirmar();

      expect(entradaServicio.listarPorFuncion).toHaveBeenCalledWith('f1');
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

      expect(reserva.tiempoRestanteTexto()).toBe('4:00');
    });

    it('descuenta de a un segundo', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: [entrada({ reservada_hasta: enMinutos(1) })],
        error: null,
      });
      await cargar();

      await vi.advanceTimersByTimeAsync(1000);

      expect(reserva.tiempoRestanteTexto()).toBe('0:59');
    });

    it('no baja de 0:00 cuando la reserva ya venció', async () => {
      entradaServicio.listarPorFuncion.mockResolvedValue({
        data: [entrada({ reservada_hasta: enMinutos(-2) })],
        error: null,
      });

      await cargar();

      expect(reserva.tiempoRestanteTexto()).toBe('0:00');
    });

    it('empieza a contar cuando llega por el canal una reserva propia', async () => {
      await cargar();
      expect(reserva.tiempoRestanteTexto()).toBeNull();

      reserva.aplicarCambio(insercion(entrada({ reservada_hasta: enMinutos(10) })));

      expect(reserva.tiempoRestanteTexto()).toBe('10:00');
    });
  });

  describe('reloj', () => {
    it('no deja un reloj corriendo si no hay reservas propias', async () => {
      await cargar();

      expect(vi.getTimerCount()).toBe(0);
    });

    it('arranca un solo reloj aunque lleguen varios cambios', async () => {
      await cargar();

      reserva.aplicarCambio(insercion(entrada({ id: 'e1', reservada_hasta: enMinutos(5) })));
      reserva.aplicarCambio(
        insercion(entrada({ id: 'e2', butaca_id: 'b2', reservada_hasta: enMinutos(5) })),
      );

      expect(vi.getTimerCount()).toBe(1);
    });

    it('se apaga cuando se libera la última reserva propia', async () => {
      await cargar();
      reserva.aplicarCambio(insercion(entrada({ id: 'e1', reservada_hasta: enMinutos(5) })));
      expect(vi.getTimerCount()).toBe(1);

      reserva.aplicarCambio(baja('e1'));

      expect(vi.getTimerCount()).toBe(0);
    });

    it('destruir detiene el reloj', async () => {
      await cargar();
      reserva.aplicarCambio(insercion(entrada({ reservada_hasta: enMinutos(5) })));

      reserva.destruir();

      expect(vi.getTimerCount()).toBe(0);
    });

    it('destruir no falla si nunca arrancó', () => {
      expect(() => reserva.destruir()).not.toThrow();
    });
  });
});
