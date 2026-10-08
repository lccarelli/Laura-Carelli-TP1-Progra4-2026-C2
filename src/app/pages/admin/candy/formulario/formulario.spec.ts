import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Errores } from '../../../../servicios/errores/errores';
import { ImagenServicio } from '../../../../servicios/imagen/imagen';
import { Logger } from '../../../../servicios/logger/logger';
import { ProductoCandyServicio } from '../../../../servicios/producto-candy/producto-candy';
import { FormularioCandy } from './formulario';

describe('FormularioCandy', () => {
  let fixture: ComponentFixture<FormularioCandy>;
  const crear = vi.fn();
  const subirArchivo = vi.fn();
  const guardarDesdeUrl = vi.fn();
  const mostrar = vi.fn();

  const html = () => fixture.nativeElement as HTMLElement;
  const imagen = () => html().querySelector<HTMLImageElement>('.preview__imagen');
  const textoPreview = () => html().querySelector('.preview')?.textContent?.trim();

  const escribirUrl = (url: string) => {
    const campo = html().querySelector<HTMLInputElement>('[formControlName="imagen_url"]')!;
    campo.value = url;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const fallarImagen = () => {
    imagen()!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioCandy],
      providers: [
        provideRouter([]),
        { provide: ProductoCandyServicio, useValue: { crear } },
        { provide: ImagenServicio, useValue: { subirArchivo, guardarDesdeUrl, eliminar: vi.fn() } },
        { provide: Errores, useValue: { mostrar } },
        { provide: Logger, useValue: { registrar: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioCandy);
    fixture.detectChanges();
  });

  it('sin URL de imagen muestra "Sin imagen"', () => {
    expect(imagen()).toBeNull();
    expect(textoPreview()).toBe('Sin imagen');
  });

  it('muestra la imagen a medida que se escribe la URL', () => {
    escribirUrl('https://img.test/pochoclo.png');

    expect(imagen()?.getAttribute('src')).toBe('https://img.test/pochoclo.png');
  });

  it('avisa si la imagen no se pudo cargar', () => {
    escribirUrl('https://img.test/rota.png');

    fallarImagen();

    expect(imagen()).toBeNull();
    expect(textoPreview()).toBe('No se pudo cargar la imagen');
  });

  it('vuelve a intentar al cambiar la URL de una imagen rota', () => {
    escribirUrl('https://img.test/rota.png');
    fallarImagen();

    escribirUrl('https://img.test/buena.png');

    expect(imagen()?.getAttribute('src')).toBe('https://img.test/buena.png');
  });

  it('al borrar la URL vuelve a "Sin imagen"', () => {
    escribirUrl('https://img.test/pochoclo.png');

    escribirUrl('');

    expect(textoPreview()).toBe('Sin imagen');
  });

  describe('imagen desde archivo', () => {
    const elegirArchivo = (archivo: File) => {
      const campo = html().querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(campo, 'files', { value: [archivo], configurable: true });
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    const archivo = new File(['x'], 'papas.png', { type: 'image/png' });

    beforeEach(() => {
      vi.clearAllMocks();
      crear.mockResolvedValue({ error: null });
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      fixture.componentInstance['formulario'].patchValue({ nombre: 'Papas', precio: 100 });
      URL.createObjectURL = vi.fn(() => 'blob:vista-previa');
    });

    it('muestra la vista previa del archivo elegido', () => {
      elegirArchivo(archivo);

      expect(imagen()?.getAttribute('src')).toBe('blob:vista-previa');
    });

    it('sube el archivo al guardar y guarda la URL del bucket', async () => {
      subirArchivo.mockResolvedValue({
        data: { url: 'https://bucket.test/candy/a.png' },
        error: null,
      });
      elegirArchivo(archivo);

      await fixture.componentInstance.guardar();

      expect(subirArchivo).toHaveBeenCalledWith(archivo, 'candy');
      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ imagen_url: 'https://bucket.test/candy/a.png' }),
      );
    });

    it('no guarda el producto si la subida falla', async () => {
      subirArchivo.mockResolvedValue({ data: null, error: { message: 'sin permiso' } });
      elegirArchivo(archivo);

      await fixture.componentInstance.guardar();

      expect(mostrar).toHaveBeenCalledWith('sin permiso');
      expect(crear).not.toHaveBeenCalled();
    });
  });

  describe('imagen desde URL', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      crear.mockResolvedValue({ error: null });
      vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      fixture.componentInstance['formulario'].patchValue({ nombre: 'Papas', precio: 100 });
    });

    it('sube la URL externa al bucket y guarda la URL del bucket', async () => {
      guardarDesdeUrl.mockResolvedValue({
        data: { url: 'https://bucket.test/candy/a.png' },
        error: null,
      });
      escribirUrl('https://sitio.test/papas.png');

      await fixture.componentInstance.guardar();

      expect(guardarDesdeUrl).toHaveBeenCalledWith('https://sitio.test/papas.png', 'candy');
      expect(crear).toHaveBeenCalledWith(
        expect.objectContaining({ imagen_url: 'https://bucket.test/candy/a.png' }),
      );
    });

    it('guarda sin imagen si no hay URL', async () => {
      await fixture.componentInstance.guardar();

      expect(guardarDesdeUrl).not.toHaveBeenCalled();
      expect(crear).toHaveBeenCalledWith(expect.objectContaining({ imagen_url: null }));
    });

    it('no guarda el producto si la URL no se pudo subir', async () => {
      guardarDesdeUrl.mockResolvedValue({
        data: null,
        error: { message: 'La URL no es una imagen' },
      });
      escribirUrl('https://sitio.test/nada');

      await fixture.componentInstance.guardar();

      expect(mostrar).toHaveBeenCalledWith('La URL no es una imagen');
      expect(crear).not.toHaveBeenCalled();
    });
  });

  it('deja de escuchar el formulario al destruirse', () => {
    const control = fixture.componentInstance['formulario'].controls.imagen_url;
    expect((control.valueChanges as Subject<unknown>).observed).toBe(true);

    fixture.destroy();

    expect((control.valueChanges as Subject<unknown>).observed).toBe(false);
  });
});
