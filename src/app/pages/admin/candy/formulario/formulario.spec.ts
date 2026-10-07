import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Errores } from '../../../../servicios/errores/errores';
import { Logger } from '../../../../servicios/logger/logger';
import { ProductoCandyServicio } from '../../../../servicios/producto-candy/producto-candy';
import { FormularioCandy } from './formulario';

describe('FormularioCandy', () => {
  let fixture: ComponentFixture<FormularioCandy>;

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
        { provide: ProductoCandyServicio, useValue: {} },
        { provide: Errores, useValue: { mostrar: vi.fn() } },
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

  it('deja de escuchar el formulario al destruirse', () => {
    const control = fixture.componentInstance['formulario'].controls.imagen_url;
    expect((control.valueChanges as Subject<unknown>).observed).toBe(true);

    fixture.destroy();

    expect((control.valueChanges as Subject<unknown>).observed).toBe(false);
  });
});
