import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BotonLink } from './boton-link';

describe('BotonLink', () => {
  let fixture: ComponentFixture<BotonLink>;

  const enlace = () => (fixture.nativeElement as HTMLElement).querySelector('a')!;
  const poner = async (datos: Record<string, unknown>) => {
    Object.entries(datos).forEach(([nombre, valor]) =>
      fixture.componentRef.setInput(nombre, valor),
    );
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonLink],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BotonLink);
  });

  it('apunta a la ruta indicada', async () => {
    await poner({ ruta: '/login' });

    expect(enlace().getAttribute('href')).toBe('/login');
  });

  it('acepta una ruta armada por partes', async () => {
    await poner({ ruta: ['/peliculas', '42'] });

    expect(enlace().getAttribute('href')).toBe('/peliculas/42');
  });

  it('agrega los parámetros de la dirección', async () => {
    await poner({ ruta: '/login', queryParams: { volver: '/funciones/7' } });

    expect(enlace().getAttribute('href')).toBe('/login?volver=%2Ffunciones%2F7');
  });

  it('agrega el fragmento', async () => {
    await poner({ ruta: '/', fragment: 'cartelera' });

    expect(enlace().getAttribute('href')).toBe('/#cartelera');
  });

  it('usa la variante por defecto y la pedida', async () => {
    await poner({ ruta: '/' });
    expect(enlace().className).toContain('boton--claro-negro');

    await poner({ variante: 'menu' });
    expect(enlace().className).toContain('boton--menu');
  });

  it('expone el texto accesible', async () => {
    await poner({ ruta: '/', ariaLabel: 'Ir al inicio' });

    expect(enlace().getAttribute('aria-label')).toBe('Ir al inicio');
  });
});
