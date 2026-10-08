import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Errores } from '../../../../servicios/errores/errores';
import { GeneroServicio } from '../../../../servicios/genero/genero';
import { ImagenServicio } from '../../../../servicios/imagen/imagen';
import { Logger } from '../../../../servicios/logger/logger';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { environment } from '../../../../../environments/environment';
import { Formulario } from './formulario';

describe('Formulario de película', () => {
  let fixture: ComponentFixture<Formulario>;
  const crear = vi.fn();
  const guardarDesdeUrl = vi.fn();
  const mostrar = vi.fn();

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
        { provide: PeliculaServicio, useValue: { crear } },
        { provide: ImagenServicio, useValue: { guardarDesdeUrl, eliminar: vi.fn() } },
        {
          provide: GeneroServicio,
          useValue: {
            listar: () => Promise.resolve({ data: [] }),
            asignarAPelicula: () => Promise.resolve({ error: null }),
          },
        },
        { provide: Errores, useValue: { mostrar } },
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

  describe('guardar con imagen', () => {
    const propia = `${environment.SUPABASE_URL}/storage/v1/object/public/imagenes/peliculas/a.jpg`;

    beforeEach(() => {
      vi.clearAllMocks();
      crear.mockResolvedValue({ data: [{ id: 'p1' }], error: null });
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      fixture.componentInstance['formulario'].patchValue({
        nombre: 'Matrix',
        duracion_minutos: 136,
      });
    });

    it('sube la imagen externa al bucket y guarda la URL del bucket', async () => {
      guardarDesdeUrl.mockResolvedValue({ data: { url: propia }, error: null });
      escribir('imagen_url', 'https://m.media-amazon.com/matrix.jpg');

      await fixture.componentInstance.guardar();

      expect(guardarDesdeUrl).toHaveBeenCalledWith('https://m.media-amazon.com/matrix.jpg');
      expect(crear).toHaveBeenCalledWith(expect.objectContaining({ imagen_url: propia }));
    });

    it('no vuelve a subir una imagen que ya está en el bucket', async () => {
      escribir('imagen_url', propia);

      await fixture.componentInstance.guardar();

      expect(guardarDesdeUrl).not.toHaveBeenCalled();
      expect(crear).toHaveBeenCalledWith(expect.objectContaining({ imagen_url: propia }));
    });

    it('guarda sin imagen si no hay URL', async () => {
      await fixture.componentInstance.guardar();

      expect(guardarDesdeUrl).not.toHaveBeenCalled();
      expect(crear).toHaveBeenCalledWith(expect.objectContaining({ imagen_url: null }));
    });

    it('no guarda la película si la imagen no se pudo subir', async () => {
      guardarDesdeUrl.mockResolvedValue({
        data: null,
        error: { message: 'La URL no es una imagen' },
      });
      escribir('imagen_url', 'https://sitio.test/no-es-imagen');

      await fixture.componentInstance.guardar();

      expect(mostrar).toHaveBeenCalledWith('La URL no es una imagen');
      expect(crear).not.toHaveBeenCalled();
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
