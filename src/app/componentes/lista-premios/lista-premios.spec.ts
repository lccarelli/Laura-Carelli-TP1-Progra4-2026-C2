import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Premio } from '../../interfaces/premio';
import { PremioAplicable } from '../../interfaces/premio-aplicable';
import { ListaPremios } from './lista-premios';

const premio = (datos: Partial<Premio>): Premio => ({
  id: 'x',
  nombre: 'Premio',
  costo_puntos: 100,
  activa: true,
  dias_validos: null,
  cantidad_entradas: null,
  monto_descuento: 1000,
  creada_en: '2026-01-01',
  ...datos,
});

const LIBRE: PremioAplicable = {
  premio: premio({ id: 'p1', nombre: 'Miércoles de cine', costo_puntos: 200 }),
  aplicable: true,
};

const RESTRINGIDO: PremioAplicable = {
  premio: premio({ id: 'p2', nombre: 'Entrada doble', dias_validos: [3, 1], cantidad_entradas: 2 }),
  aplicable: false,
};

describe('ListaPremios', () => {
  let fixture: ComponentFixture<ListaPremios>;
  let elegidos: string[];

  const html = () => fixture.nativeElement as HTMLElement;
  const tiles = () => html().querySelectorAll<HTMLButtonElement>('.premio-tile');
  const render = async (premios: PremioAplicable[], seleccionado: string | null = null) => {
    fixture.componentRef.setInput('premios', premios);
    fixture.componentRef.setInput('seleccionado', seleccionado);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListaPremios] }).compileComponents();

    fixture = TestBed.createComponent(ListaPremios);
    elegidos = [];
    fixture.componentInstance.elegir.subscribe((id) => elegidos.push(id));
  });

  it('muestra nombre, puntos y descuento de cada premio', async () => {
    await render([LIBRE]);

    expect(tiles()[0].textContent).toContain('Miércoles de cine');
    expect(tiles()[0].textContent).toContain('200 pts · -$1000');
  });

  it('emite el id del premio al elegirlo', async () => {
    await render([LIBRE]);

    tiles()[0].click();

    expect(elegidos).toEqual(['p1']);
  });

  it('deshabilita el premio que no aplica y explica por qué', async () => {
    await render([RESTRINGIDO]);

    expect(tiles()[0].disabled).toBe(true);
    expect(
      tiles()[0].querySelector('.premio-tile__motivo')?.textContent?.replace(/\s+/g, ' ').trim(),
    ).toBe('Sólo Lunes, Miércoles · 2 entradas');
  });

  it('no emite al tocar un premio que no aplica', async () => {
    await render([RESTRINGIDO]);

    tiles()[0].click();

    expect(elegidos).toEqual([]);
  });

  it('no muestra el motivo en un premio aplicable', async () => {
    await render([LIBRE]);

    expect(html().querySelector('.premio-tile__motivo')).toBeNull();
  });

  it('marca como activo sólo el premio seleccionado', async () => {
    await render([LIBRE, RESTRINGIDO], 'p1');

    expect(tiles()[0].classList).toContain('premio-tile--activo');
    expect(tiles()[1].classList).not.toContain('premio-tile--activo');
  });
});
