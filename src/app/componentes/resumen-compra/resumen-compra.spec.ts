import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Butaca } from '../../interfaces/butaca';
import { LineaDescuento } from '../../interfaces/linea-descuento';
import { LineaResumen } from '../../interfaces/linea-resumen';
import { PremioAplicable } from '../../interfaces/premio-aplicable';
import { ResumenCompra } from './resumen-compra';

const butaca = (fila: string, numero: number, tipo: Butaca['tipo']): Butaca => ({
  id: `${fila}${numero}`,
  sala_id: 's1',
  fila,
  numero,
  bloque: 'centro',
  tipo,
});

const PREMIO: PremioAplicable = {
  premio: {
    id: 'p1',
    nombre: 'Entrada gratis',
    costo_puntos: 100,
    activa: true,
    dias_validos: null,
    cantidad_entradas: null,
    monto_descuento: 4000,
    creada_en: '2026-01-01',
  },
  aplicable: true,
};

describe('ResumenCompra', () => {
  let fixture: ComponentFixture<ResumenCompra>;
  let elegidos: string[];

  const html = () => fixture.nativeElement as HTMLElement;
  const texto = () => html().textContent?.replace(/\s+/g, ' ') ?? '';
  const mostrar = async (datos: Record<string, unknown> = {}) => {
    const valores = {
      butacas: [butaca('A', 1, 'normal')],
      combos: [] as LineaResumen[],
      candy: [] as LineaResumen[],
      premios: [] as PremioAplicable[],
      premioSeleccionado: null,
      descuentos: [] as LineaDescuento[],
      total: 4000,
      ...datos,
    };

    Object.entries(valores).forEach(([nombre, valor]) =>
      fixture.componentRef.setInput(nombre, valor),
    );
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ResumenCompra] }).compileComponents();
    fixture = TestBed.createComponent(ResumenCompra);
    elegidos = [];
    fixture.componentInstance.elegirPremio.subscribe((id) => elegidos.push(id));
  });

  it('lista cada butaca con fila, número y tipo', async () => {
    await mostrar({ butacas: [butaca('A', 1, 'normal'), butaca('B', 7, 'accesible')] });

    const items = [...html().querySelectorAll('li')].map((li) => li.textContent);

    expect(items).toEqual(['A1 (normal)', 'B7 (accesible)']);
  });

  it('muestra el total', async () => {
    await mostrar({ total: 12500 });

    expect(texto()).toContain('Total: $12500');
  });

  it('avisa cuántas butacas VIP se compran', async () => {
    await mostrar({
      butacas: [butaca('A', 1, 'vip'), butaca('A', 2, 'vip'), butaca('A', 3, 'normal')],
    });

    expect(html().querySelector('.aviso-vip')?.textContent).toContain(
      'Estás comprando 2 butaca(s) VIP',
    );
  });

  it('no avisa de VIP si no hay', async () => {
    await mostrar();

    expect(html().querySelector('.aviso-vip')).toBeNull();
  });

  it('muestra combos y candy con su cantidad sólo si hay', async () => {
    await mostrar({
      combos: [{ cantidad: 1, nombre: 'Combo Clásico' }],
      candy: [{ cantidad: 3, nombre: 'Gaseosa' }],
    });

    const titulos = [...html().querySelectorAll('h3')].map((h) => h.textContent);
    const items = [...html().querySelectorAll('li')].map((li) => li.textContent);

    expect(titulos).toEqual(['Butacas', 'Combos', 'Candy']);
    expect(items).toEqual(['A1 (normal)', '1x Combo Clásico', '3x Gaseosa']);
  });

  it('oculta los títulos de combos, candy y premios cuando están vacíos', async () => {
    await mostrar();

    const titulos = [...html().querySelectorAll('h3')].map((h) => h.textContent);

    expect(titulos).toEqual(['Butacas']);
  });

  it('muestra los premios y emite el que se elige', async () => {
    await mostrar({ premios: [PREMIO] });

    html().querySelector<HTMLButtonElement>('.premio-tile')?.click();

    expect(texto()).toContain('Premios');
    expect(elegidos).toEqual(['p1']);
  });

  it('marca como elegido el premio seleccionado', async () => {
    await mostrar({ premios: [PREMIO], premioSeleccionado: 'p1' });

    expect(html().querySelector('.premio-tile--activo')).not.toBeNull();
  });

  it('muestra cada descuento con su monto', async () => {
    await mostrar({
      descuentos: [
        { etiqueta: 'Precio de preventa (-25%)', monto: 1000 },
        { etiqueta: 'Crédito disponible', monto: 500 },
      ],
    });

    const lineas = [...html().querySelectorAll('.resumen-compra__descuento')].map((p) =>
      p.textContent?.trim(),
    );

    expect(lineas).toEqual(['Precio de preventa (-25%): -$1000', 'Crédito disponible: -$500']);
  });

  it('no muestra líneas de descuento si no hay', async () => {
    await mostrar();

    expect(html().querySelector('.resumen-compra__descuento')).toBeNull();
  });
});
