import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { ConfirmarAccion } from './confirmar-accion';

describe('ConfirmarAccion', () => {
  let fixture: ComponentFixture<ConfirmarAccion>;
  let confirmar: Mock<() => void>;
  let cancelar: Mock<() => void>;

  const html = () => fixture.nativeElement as HTMLElement;
  const botones = () => Array.from(html().querySelectorAll<HTMLButtonElement>('button'));
  const boton = (texto: string) => botones().find((b) => b.textContent?.includes(texto))!;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmarAccion);
    fixture.componentRef.setInput('mensaje', '¿Eliminar 3 funciones?');
    confirmar = vi.fn<() => void>();
    cancelar = vi.fn<() => void>();
    fixture.componentInstance.confirmar.subscribe(confirmar);
    fixture.componentInstance.cancelar.subscribe(cancelar);
    fixture.detectChanges();
  });

  it('muestra el mensaje', () => {
    expect(html().textContent).toContain('¿Eliminar 3 funciones?');
  });

  it('confirma al tocar el botón de acción', () => {
    boton('Eliminar').click();

    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(cancelar).not.toHaveBeenCalled();
  });

  it('cancela al tocar Cancelar', () => {
    boton('Cancelar').click();

    expect(cancelar).toHaveBeenCalledTimes(1);
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('usa la etiqueta que se le pasa', () => {
    fixture.componentRef.setInput('etiqueta', 'Borrar todo');
    fixture.detectChanges();

    expect(boton('Borrar todo')).toBeTruthy();
  });
});
