import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AvisoUso } from './aviso-uso';

@Component({
  imports: [AvisoUso],
  template: `<app-aviso-uso [titulo]="titulo" [usado]="usado">{{ detalle }}</app-aviso-uso>`,
})
class Anfitrion {
  titulo = 'Ingreso validado';
  usado = false;
  detalle = '2 entradas';
}

describe('AvisoUso', () => {
  const crear = () => {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    return fixture;
  };
  const aviso = (fixture: ReturnType<typeof crear>) =>
    (fixture.nativeElement as HTMLElement).querySelector('.aviso')!;

  it('muestra el título, el detalle y el ícono de check', () => {
    const fixture = crear();
    const html = fixture.nativeElement as HTMLElement;

    expect(html.querySelector('.aviso__titulo')?.textContent).toBe('Ingreso validado');
    expect(html.querySelector('.aviso__detalle')?.textContent?.trim()).toBe('2 entradas');
    expect(html.querySelector('img')?.getAttribute('src')).toBe('/checkbox.png');
  });

  it('por defecto es un aviso de éxito', () => {
    expect(aviso(crear()).classList.contains('aviso--usado')).toBe(false);
  });

  it('con usado cambia al estilo de advertencia', () => {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.componentInstance.usado = true;
    fixture.detectChanges();

    expect(aviso(fixture).classList.contains('aviso--usado')).toBe(true);
  });
});
