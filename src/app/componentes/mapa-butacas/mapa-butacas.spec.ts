import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Butaca } from '../../interfaces/butaca';
import { Entrada } from '../../interfaces/entrada';
import { MapaButacas } from './mapa-butacas';

const butaca = (
  fila: string,
  numero: number,
  tipo: Butaca['tipo'] = 'normal',
  bloque: Butaca['bloque'] = 'centro',
): Butaca => ({ id: `${fila}${numero}`, sala_id: 's1', fila, numero, bloque, tipo });

const entrada = (butacaId: string, datos: Partial<Entrada> = {}): Entrada => ({
  id: `e-${butacaId}`,
  funcion_id: 'f1',
  butaca_id: butacaId,
  estado: 'reservada',
  reservada_hasta: new Date(Date.now() + 600_000).toISOString(),
  codigo_compra: null,
  sesion_id: 'otra',
  creada_en: '2026-10-10T19:50:00Z',
  validada_en: null,
  validada_por: null,
  ...datos,
});

describe('MapaButacas', () => {
  let fixture: ComponentFixture<MapaButacas>;
  let tocadas: string[];

  const html = () => fixture.nativeElement as HTMLElement;
  const boton = (id: string) => html().querySelector<HTMLButtonElement>(`button[title="${id}"]`)!;
  const poner = async (datos: Record<string, unknown>) => {
    Object.entries(datos).forEach(([nombre, valor]) =>
      fixture.componentRef.setInput(nombre, valor),
    );
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MapaButacas] }).compileComponents();
    fixture = TestBed.createComponent(MapaButacas);
    tocadas = [];
    fixture.componentInstance.alternar.subscribe((id) => tocadas.push(id));
  });

  describe('distribución', () => {
    it('dibuja un botón por butaca', async () => {
      await poner({ butacas: [butaca('A', 1), butaca('A', 2), butaca('B', 1)] });

      expect(html().querySelectorAll('button.butaca')).toHaveLength(3);
    });

    it('ordena las filas por letra y las butacas por número', async () => {
      await poner({ butacas: [butaca('B', 1), butaca('A', 2), butaca('A', 1)] });

      const titulos = [...html().querySelectorAll('button.butaca')].map((b) =>
        b.getAttribute('title'),
      );

      expect(titulos).toEqual(['A1', 'A2', 'B1']);
    });

    it('separa los bloques izquierdo, centro y derecho con pasillos', async () => {
      await poner({
        butacas: [
          butaca('A', 3, 'normal', 'derecho'),
          butaca('A', 1, 'normal', 'izquierdo'),
          butaca('A', 2, 'normal', 'centro'),
        ],
      });

      const titulos = [...html().querySelectorAll('button.butaca')].map((b) =>
        b.getAttribute('title'),
      );

      expect(titulos).toEqual(['A1', 'A2', 'A3']);
      expect(html().querySelectorAll('.mapa__pasillo')).toHaveLength(2);
    });

    it('marca el tipo accesible y VIP', async () => {
      await poner({ butacas: [butaca('A', 1, 'accesible'), butaca('A', 2, 'vip')] });

      expect(boton('A1').classList).toContain('butaca--accesible');
      expect(boton('A2').classList).toContain('butaca--vip');
    });
  });

  describe('estado de cada butaca', () => {
    beforeEach(async () => {
      await poner({ interactiva: true, butacas: [butaca('A', 1), butaca('A', 2), butaca('A', 3)] });
    });

    it('sin entrada está libre y se puede tocar', () => {
      expect(boton('A1').disabled).toBe(false);
      expect(boton('A1').classList).not.toContain('butaca--reservada');
      expect(boton('A1').classList).not.toContain('butaca--vendida');
    });

    it('una reserva ajena vigente aparece reservada y bloqueada', async () => {
      await poner({ entradas: [entrada('A1')] });

      expect(boton('A1').classList).toContain('butaca--reservada');
      expect(boton('A1').disabled).toBe(true);
    });

    it('una venta aparece vendida y bloqueada', async () => {
      await poner({ entradas: [entrada('A1', { estado: 'vendida', reservada_hasta: null })] });

      expect(boton('A1').classList).toContain('butaca--vendida');
      expect(boton('A1').disabled).toBe(true);
    });

    it('una reserva ajena vencida cuenta como libre', async () => {
      await poner({
        entradas: [entrada('A1', { reservada_hasta: new Date(Date.now() - 1000).toISOString() })],
      });

      expect(boton('A1').classList).not.toContain('butaca--reservada');
      expect(boton('A1').disabled).toBe(false);
    });

    it('mi propia reserva se ve libre para mí', async () => {
      await poner({ entradas: [entrada('A1')], reservadasPropias: new Set(['A1']) });

      expect(boton('A1').classList).not.toContain('butaca--reservada');
      expect(boton('A1').disabled).toBe(false);
    });

    it('la butaca seleccionada se marca y se puede soltar', async () => {
      await poner({ seleccionadas: new Set(['A2']) });

      expect(boton('A2').classList).toContain('butaca--seleccionada');
      expect(boton('A2').disabled).toBe(false);
    });

    it('se actualiza cuando cambian las entradas', async () => {
      await poner({ entradas: [entrada('A3')] });
      expect(boton('A3').classList).toContain('butaca--reservada');

      await poner({ entradas: [] });

      expect(boton('A3').classList).not.toContain('butaca--reservada');
    });
  });

  describe('toques', () => {
    beforeEach(async () => {
      await poner({
        interactiva: true,
        butacas: [butaca('A', 1), butaca('A', 2), butaca('A', 3)],
        entradas: [entrada('A2'), entrada('A3', { estado: 'vendida', reservada_hasta: null })],
        seleccionadas: new Set<string>(),
      });
    });

    it('emite el id de una butaca libre', () => {
      boton('A1').click();

      expect(tocadas).toEqual(['A1']);
    });

    it('no emite al tocar una butaca reservada por otro', () => {
      boton('A2').click();

      expect(tocadas).toEqual([]);
    });

    it('no emite al tocar una butaca vendida', () => {
      boton('A3').click();

      expect(tocadas).toEqual([]);
    });

    it('emite al tocar una butaca propia seleccionada', async () => {
      await poner({ seleccionadas: new Set(['A1']) });

      boton('A1').click();

      expect(tocadas).toEqual(['A1']);
    });

    it('en modo sólo lectura no deja tocar nada', async () => {
      await poner({ interactiva: false });

      expect(boton('A1').disabled).toBe(true);
    });
  });

  describe('resumen (sólo lectura)', () => {
    const butacas = [
      butaca('A', 1),
      butaca('A', 2, 'vip'),
      butaca('A', 3, 'accesible'),
      butaca('A', 4),
    ];
    const entradas = [entrada('A2'), entrada('A3', { estado: 'vendida', reservada_hasta: null })];

    it('se muestra con el mapa en modo sólo lectura', async () => {
      await poner({ butacas, entradas, interactiva: false });

      expect(html().querySelector('.mapa__resumen')).not.toBeNull();
    });

    it('no se muestra con el mapa interactivo', async () => {
      await poner({ butacas, entradas, interactiva: true });

      expect(html().querySelector('.mapa__resumen')).toBeNull();
    });

    it('cuenta las butacas por estado y tipo, con el total', async () => {
      await poner({ butacas, entradas, interactiva: false });

      const filas = [
        ...html().querySelectorAll('.mapa__resumen tbody tr, .mapa__resumen tfoot tr'),
      ].map((fila) =>
        [...fila.querySelectorAll('th, td')].map((celda) => celda.textContent?.trim()),
      );

      expect(filas).toEqual([
        ['Libre', '2', '0', '0', '2'],
        ['Reservada', '0', '0', '1', '1'],
        ['Vendida', '0', '1', '0', '1'],
        ['Total', '2', '1', '1', '4'],
      ]);
    });
  });
});
