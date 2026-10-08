import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Pelicula } from '../../interfaces/pelicula';
import { TarjetaPelicula } from './tarjeta-pelicula';

const PELICULA = {
  id: 'p1',
  nombre: 'Matrix',
  imagen_url: 'matrix.png',
  restriccion_edad: 16,
} as Pelicula;

describe('TarjetaPelicula', () => {
  let fixture: ComponentFixture<TarjetaPelicula>;

  const html = () => fixture.nativeElement as HTMLElement;
  const insignias = () =>
    [...html().querySelectorAll('.insignia')].map((i) => i.textContent?.trim());
  const poner = async (datos: Record<string, unknown> = {}) => {
    fixture.componentRef.setInput('pelicula', PELICULA);
    Object.entries(datos).forEach(([nombre, valor]) =>
      fixture.componentRef.setInput(nombre, valor),
    );
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaPelicula],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(TarjetaPelicula);
  });

  it('muestra el nombre y enlaza al detalle de la película', async () => {
    await poner();

    expect(html().querySelector('.tarjeta-pelicula__nombre')?.textContent).toBe('Matrix');
    expect(html().querySelector('a')?.getAttribute('href')).toBe('/peliculas/p1');
  });

  it('muestra el póster de la película', async () => {
    await poner();

    expect(html().querySelector('img')?.getAttribute('src')).toBe('matrix.png');
  });

  it('muestra la edad mínima', async () => {
    await poner();

    expect(insignias()).toEqual(['+16']);
  });

  it('no muestra insignia de edad si no hay restricción', async () => {
    fixture.componentRef.setInput('pelicula', { ...PELICULA, restriccion_edad: null });
    await fixture.whenStable();

    expect(insignias()).toEqual([]);
  });

  it('muestra el promedio en estrellas', async () => {
    await poner({ promedio: 4 });

    expect(insignias()).toContain('★★★★☆');
  });

  it('muestra un promedio de 0 estrellas', async () => {
    await poner({ promedio: 0 });

    expect(insignias()).toContain('☆☆☆☆☆');
  });

  it('muestra Estreno y Preventa sólo cuando corresponden', async () => {
    await poner();
    expect(insignias()).not.toContain('Estreno');
    expect(insignias()).not.toContain('Preventa');

    await poner({ esEstreno: true, esPreventa: true });

    expect(insignias()).toEqual(expect.arrayContaining(['Estreno', 'Preventa']));
  });

  it('muestra los géneros', async () => {
    await poner({ generos: [{ id: 'g1', nombre: 'Acción' }] });

    expect(insignias()).toContain('Acción');
  });
});
