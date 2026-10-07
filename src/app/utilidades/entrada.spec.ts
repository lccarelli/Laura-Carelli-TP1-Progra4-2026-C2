import { Entrada } from '../interfaces/entrada';
import { entradaVigente } from './entrada';

const AHORA = new Date('2026-10-07T12:00:00Z');

function entrada(datos: Partial<Entrada>): Entrada {
  return {
    id: 'e1',
    funcion_id: 'f1',
    butaca_id: 'b1',
    estado: 'reservada',
    reservada_hasta: null,
    codigo_compra: null,
    sesion_id: null,
    creada_en: AHORA.toISOString(),
    validada_en: null,
    validada_por: null,
    ...datos,
  };
}

describe('entradaVigente', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AHORA);
  });

  afterEach(() => vi.useRealTimers());

  it('una entrada vendida siempre está vigente', () => {
    expect(entradaVigente(entrada({ estado: 'vendida' }))).toBe(true);
  });

  it('una reserva que todavía no venció está vigente', () => {
    expect(entradaVigente(entrada({ reservada_hasta: '2026-10-07T12:05:00Z' }))).toBe(true);
  });

  it('una reserva vencida no está vigente', () => {
    expect(entradaVigente(entrada({ reservada_hasta: '2026-10-07T11:59:00Z' }))).toBe(false);
  });

  it('una reserva sin vencimiento se considera vigente', () => {
    expect(entradaVigente(entrada({ reservada_hasta: null }))).toBe(true);
  });
});
