import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { Errores } from '../../servicios/errores/errores';
import { LectorCodigo } from './lector-codigo';

describe('LectorCodigo', () => {
  let fixture: ComponentFixture<LectorCodigo>;
  let buscar: Mock<(codigo: string) => void>;

  const html = () => fixture.nativeElement as HTMLElement;
  const botonCamara = () =>
    html().querySelector<HTMLButtonElement>('button[aria-label="Escanear con cámara"]');

  const escribir = (valor: string) => {
    const campo = html().querySelector<HTMLInputElement>('input')!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Errores, useValue: { mostrar: vi.fn() } }],
    });
    fixture = TestBed.createComponent(LectorCodigo);
    buscar = vi.fn<(codigo: string) => void>();
    fixture.componentInstance.buscar.subscribe(buscar);
    fixture.detectChanges();
  });

  it('muestra el ícono de QR en lugar de un botón de texto para la cámara', () => {
    expect(botonCamara()?.querySelector('img')?.getAttribute('src')).toBe('/scanner.png');
    expect(html().textContent).not.toContain('Escanear con cámara');
  });

  it('emite el código normalizado al tocar Buscar', () => {
    escribir(' abcd-2345 ');

    Array.from(html().querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Buscar'))!
      .click();

    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith(expect.stringMatching(/^[A-Z0-9]+$/));
  });

  it('no emite nada si el campo está vacío', () => {
    Array.from(html().querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Buscar'))!
      .click();

    expect(buscar).not.toHaveBeenCalled();
  });

  it('deshabilita Buscar mientras se está buscando', () => {
    fixture.componentRef.setInput('buscando', true);
    fixture.detectChanges();

    const botonBuscar = Array.from(html().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Buscar'),
    )!;

    expect(botonBuscar.disabled).toBe(true);
  });
});
