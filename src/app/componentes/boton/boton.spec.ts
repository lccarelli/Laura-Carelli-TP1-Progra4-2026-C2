import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Boton } from './boton';

describe('Boton', () => {
  let fixture: ComponentFixture<Boton>;
  let clics: number;

  const boton = () => (fixture.nativeElement as HTMLElement).querySelector('button')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Boton] }).compileComponents();
    fixture = TestBed.createComponent(Boton);
    clics = 0;
    fixture.componentInstance.clic.subscribe(() => clics++);
    await fixture.whenStable();
  });

  it('es un botón común, habilitado y de variante claro-negro por defecto', () => {
    expect(boton().type).toBe('button');
    expect(boton().disabled).toBe(false);
    expect(boton().className).toBe('boton boton--claro-negro');
  });

  it('aplica la variante pedida', async () => {
    fixture.componentRef.setInput('variante', 'menu');
    await fixture.whenStable();

    expect(boton().className).toBe('boton boton--menu');
  });

  it('puede ser de envío de formulario', async () => {
    fixture.componentRef.setInput('tipo', 'submit');
    await fixture.whenStable();

    expect(boton().type).toBe('submit');
  });

  it('expone el texto accesible', async () => {
    fixture.componentRef.setInput('ariaLabel', 'Cerrar');
    await fixture.whenStable();

    expect(boton().getAttribute('aria-label')).toBe('Cerrar');
  });

  it('avisa cuando se toca', () => {
    boton().click();

    expect(clics).toBe(1);
  });

  it('no avisa cuando está deshabilitado', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    boton().click();

    expect(boton().disabled).toBe(true);
    expect(clics).toBe(0);
  });
});
