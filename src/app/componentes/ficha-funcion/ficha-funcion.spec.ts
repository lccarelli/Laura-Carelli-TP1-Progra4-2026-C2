import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Funcion } from '../../interfaces/funcion';
import { Pelicula } from '../../interfaces/pelicula';
import { FichaFuncion } from './ficha-funcion';

const FUNCION = {
  inicio: '2026-10-14T20:30:00',
  formato: '3d',
  idioma: 'subtitulada',
} as Funcion;

const PELICULA = { nombre: 'Matrix', imagen_url: 'matrix.png' } as Pelicula;

describe('FichaFuncion', () => {
  let fixture: ComponentFixture<FichaFuncion>;

  const html = () => fixture.nativeElement as HTMLElement;
  const filas = () =>
    [...html().querySelectorAll('.detalle__fila')].map((fila) => [
      fila.querySelector('dt')?.textContent,
      fila.querySelector('dd')?.textContent,
    ]);
  const mostrar = async (pelicula: Pelicula | null = PELICULA) => {
    fixture.componentRef.setInput('funcion', FUNCION);
    fixture.componentRef.setInput('pelicula', pelicula);
    fixture.componentRef.setInput('sala', 'Sala 2');
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FichaFuncion] }).compileComponents();
    fixture = TestBed.createComponent(FichaFuncion);
  });

  it('muestra el nombre de la película', async () => {
    await mostrar();

    expect(html().querySelector('h2')?.textContent).toBe('Matrix');
  });

  it('muestra sala, hora, formato en mayúsculas e idioma', async () => {
    await mostrar();

    expect(filas()).toEqual([
      ['Sala', 'Sala 2'],
      ['Día', expect.stringContaining('14/10/2026')],
      ['Hora', '20:30'],
      ['Formato', '3D'],
      ['Idioma', 'subtitulada'],
    ]);
  });

  it('no falla mientras la película todavía no cargó', async () => {
    await mostrar(null);

    expect(html().querySelector('h2')?.textContent).toBe('');
    expect(filas()).toHaveLength(5);
  });
});
