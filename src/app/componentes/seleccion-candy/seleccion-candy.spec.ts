import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComboConProductos } from '../../servicios/combo/combo';
import { ProductoCandy } from '../../interfaces/producto-candy';
import { Cantidades } from '../../utilidades/cantidades';
import { SeleccionCandy } from './seleccion-candy';

const PRODUCTOS: ProductoCandy[] = [
  { id: 'p1', nombre: 'Pochoclo', precio: 3000, imagen_url: null, activo: true },
  { id: 'p2', nombre: 'Gaseosa', precio: 2000, imagen_url: 'gaseosa.png', activo: true },
];

const COMBOS = [
  {
    id: 'c1',
    nombre: 'Combo Clásico',
    precio: 4500,
    combo_producto: [
      { producto_candy_id: 'p1', cantidad: 1, producto_candy: { nombre: 'Pochoclo' } },
      { producto_candy_id: 'p2', cantidad: 2, producto_candy: { nombre: 'Gaseosa' } },
    ],
  },
] as unknown as ComboConProductos[];

describe('SeleccionCandy', () => {
  let fixture: ComponentFixture<SeleccionCandy>;
  let carritoCombos: Cantidades;
  let carritoCandy: Cantidades;

  const html = () => fixture.nativeElement as HTMLElement;
  const render = async (combos = COMBOS, productos = PRODUCTOS) => {
    fixture.componentRef.setInput('combos', combos);
    fixture.componentRef.setInput('productos', productos);
    await fixture.whenStable();
  };
  const botonesDe = (selector: string) =>
    html().querySelectorAll<HTMLButtonElement>(`${selector} app-selector-cantidad button`);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SeleccionCandy] }).compileComponents();

    fixture = TestBed.createComponent(SeleccionCandy);
    carritoCombos = new Cantidades();
    carritoCandy = new Cantidades();
    fixture.componentRef.setInput('carritoCombos', carritoCombos);
    fixture.componentRef.setInput('carritoCandy', carritoCandy);
  });

  it('lista cada producto con su nombre y precio', async () => {
    await render();

    const items = html().querySelectorAll('.candy-item');

    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Pochoclo');
    expect(items[0].textContent).toContain('$3000');
  });

  it('muestra la imagen sólo si el producto la tiene', async () => {
    await render();

    const items = html().querySelectorAll('.candy-item');

    expect(items[0].querySelector('img')).toBeNull();
    expect(items[1].querySelector('img')?.getAttribute('src')).toBe('gaseosa.png');
  });

  it('lista los combos con lo que incluyen', async () => {
    await render();

    const combo = html().querySelector('.combo-item');

    expect(combo?.textContent).toContain('Combo Clásico');
    expect(combo?.querySelector('.combo-item__incluye')?.textContent).toBe(
      '1x Pochoclo, 2x Gaseosa',
    );
    expect(combo?.textContent).toContain('$4500');
  });

  it('muestra "—" si un producto del combo no tiene nombre', async () => {
    const sinNombre = [
      {
        ...COMBOS[0],
        combo_producto: [{ producto_candy_id: 'p9', cantidad: 1, producto_candy: null }],
      },
    ] as unknown as ComboConProductos[];

    await render(sinNombre);

    expect(html().querySelector('.combo-item__incluye')?.textContent).toBe('1x —');
  });

  it('oculta la sección de combos si no hay', async () => {
    await render([]);

    expect(html().querySelector('.combos-destacados')).toBeNull();
    expect(html().querySelector('.combos-destacados__titulo')).toBeNull();
  });

  it('avisa cuando no hay candy', async () => {
    await render(COMBOS, []);

    expect(html().querySelector('.candy-grilla__vacio')?.textContent).toContain(
      'No hay candy disponible',
    );
  });

  it('suma y resta en el carrito de candy', async () => {
    await render();
    const [restar, sumar] = botonesDe('.candy-item');

    sumar.click();
    sumar.click();
    restar.click();

    expect(carritoCandy.de('p1')).toBe(1);
    expect(carritoCombos.valores().size).toBe(0);
  });

  it('suma en el carrito de combos sin tocar el de candy', async () => {
    await render();
    const [, sumar] = botonesDe('.combo-item');

    sumar.click();

    expect(carritoCombos.de('c1')).toBe(1);
    expect(carritoCandy.valores().size).toBe(0);
  });

  it('refleja la cantidad del carrito', async () => {
    carritoCandy.sumar('p2');
    carritoCandy.sumar('p2');
    await render();

    const cantidad = html()
      .querySelectorAll('.candy-item')[1]
      .querySelector('app-selector-cantidad span');

    expect(cantidad?.textContent).toBe('2');
  });
});
