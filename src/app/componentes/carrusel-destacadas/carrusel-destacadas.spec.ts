import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Pelicula } from '../../interfaces/pelicula';
import { CarruselDestacadas } from './carrusel-destacadas';
import { DestacadaVista } from './destacada-vista';

const destacada = (id: string, datos: Partial<Pelicula> = {}): DestacadaVista => ({
  pelicula: {
    id,
    nombre: `Película ${id}`,
    imagen_url: `${id}.png`,
    sinopsis: `Sinopsis ${id}`,
    restriccion_edad: null,
    trailer_url: null,
    ...datos,
  } as Pelicula,
  promedio: null,
  esEstreno: false,
  generos: [],
});

describe('CarruselDestacadas', () => {
  let fixture: ComponentFixture<CarruselDestacadas>;

  const html = () => fixture.nativeElement as HTMLElement;
  const slides = () => [...html().querySelectorAll<HTMLElement>('.carrusel__slide')];
  const visibles = () => slides().filter((slide) => !slide.hidden);
  const puntos = () => [...html().querySelectorAll<HTMLButtonElement>('.carrusel__punto')];
  const poner = async (items: DestacadaVista[]) => {
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselDestacadas],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(CarruselDestacadas);
  });

  it('no dibuja nada sin destacadas', async () => {
    await poner([]);

    expect(html().querySelector('.carrusel')).toBeNull();
  });

  it('muestra sólo la primera destacada al empezar', async () => {
    await poner([destacada('a'), destacada('b')]);

    expect(visibles()).toHaveLength(1);
    expect(visibles()[0].textContent).toContain('Película a');
  });

  it('no muestra puntos si hay una sola', async () => {
    await poner([destacada('a')]);

    expect(puntos()).toHaveLength(0);
  });

  it('cambia de destacada al tocar un punto', async () => {
    await poner([destacada('a'), destacada('b'), destacada('c')]);

    puntos()[2].click();
    await fixture.whenStable();

    expect(visibles()[0].textContent).toContain('Película c');
    expect(puntos()[2].classList).toContain('carrusel__punto--activo');
  });

  it('muestra el póster si no hay tráiler', async () => {
    await poner([destacada('a')]);

    expect(html().querySelector('app-poster')).not.toBeNull();
    expect(html().querySelector('iframe')).toBeNull();
  });

  it('embebe el tráiler de YouTube cuando lo hay', async () => {
    await poner([destacada('a', { trailer_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })]);

    const iframe = html().querySelector('iframe');

    expect(iframe?.getAttribute('src')).toContain('youtube.com/embed/dQw4w9WgXcQ');
    expect(iframe?.getAttribute('src')).toContain('autoplay=1');
  });

  it('muestra la animación de carga hasta que el tráiler cargó', async () => {
    await poner([destacada('a', { trailer_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })]);
    expect(html().querySelector('.carrusel__cargando')).not.toBeNull();

    html().querySelector('iframe')?.dispatchEvent(new Event('load'));
    await fixture.whenStable();

    expect(html().querySelector('.carrusel__cargando')).toBeNull();
  });

  it('vuelve a la primera si la lista cambia y la actual ya no está', async () => {
    await poner([destacada('a'), destacada('b')]);
    puntos()[1].click();
    await fixture.whenStable();

    await poner([destacada('x'), destacada('y')]);

    expect(visibles()[0].textContent).toContain('Película x');
  });

  it('sigue en la misma película si la lista cambia pero ella sigue', async () => {
    await poner([destacada('a'), destacada('b')]);
    puntos()[1].click();
    await fixture.whenStable();

    await poner([destacada('c'), destacada('b')]);

    expect(visibles()[0].textContent).toContain('Película b');
  });
});
