import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Errores } from '../../../../servicios/errores/errores';
import { GeneroServicio } from '../../../../servicios/genero/genero';
import { Logger } from '../../../../servicios/logger/logger';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { Formulario } from './formulario';

describe('Formulario de película', () => {
  let fixture: ComponentFixture<Formulario>;

  const html = () => fixture.nativeElement as HTMLElement;
  const imagen = () => html().querySelector<HTMLImageElement>('.preview__imagen');
  const textoPreview = () => html().querySelector('.preview')?.textContent?.trim();
  const consultaTrailer = () => fixture.componentInstance['consultaTrailer']();

  const escribir = (control: string, valor: string) => {
    const campo = html().querySelector<HTMLInputElement>(`[formControlName="${control}"]`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Formulario],
      providers: [
        provideRouter([]),
        { provide: PeliculaServicio, useValue: {} },
        { provide: GeneroServicio, useValue: { listar: () => Promise.resolve({ data: [] }) } },
        { provide: Errores, useValue: { mostrar: vi.fn() } },
        { provide: Logger, useValue: { registrar: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Formulario);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  describe('imagen', () => {
    it('sin URL muestra "Sin imagen"', () => {
      expect(textoPreview()).toBe('Sin imagen');
    });

    it('muestra la imagen a medida que se escribe la URL', () => {
      escribir('imagen_url', 'https://img.test/matrix.jpg');

      expect(imagen()?.getAttribute('src')).toBe('https://img.test/matrix.jpg');
    });

    it('avisa si no se pudo cargar y reintenta al cambiar la URL', () => {
      escribir('imagen_url', 'https://img.test/rota.jpg');
      imagen()!.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(textoPreview()).toBe('No se pudo cargar la imagen');

      escribir('imagen_url', 'https://img.test/buena.jpg');

      expect(imagen()?.getAttribute('src')).toBe('https://img.test/buena.jpg');
    });
  });

  describe('búsqueda de tráiler', () => {
    it('arranca vacía salvo por el texto fijo', () => {
      expect(consultaTrailer()).toBe('trailer oficial');
    });

    it('incluye el nombre y el año de estreno mientras se escriben', () => {
      escribir('nombre', 'The Matrix');
      escribir('fecha_estreno', '1999-03-31');

      expect(consultaTrailer()).toBe('The Matrix 1999 trailer oficial');
    });

    it('sigue al campo nombre si se corrige', () => {
      escribir('nombre', 'The Matrx');
      escribir('nombre', 'The Matrix');

      expect(consultaTrailer()).toBe('The Matrix trailer oficial');
    });
  });

  it('deja de escuchar el formulario al destruirse', () => {
    const formulario = fixture.componentInstance['formulario'];
    expect((formulario.valueChanges as Subject<unknown>).observed).toBe(true);

    fixture.destroy();

    expect((formulario.valueChanges as Subject<unknown>).observed).toBe(false);
  });
});
