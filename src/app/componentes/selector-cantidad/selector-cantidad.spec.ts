import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectorCantidad } from './selector-cantidad';

describe('SelectorCantidad', () => {
  let fixture: ComponentFixture<SelectorCantidad>;
  let sumas: number;
  let restas: number;

  const html = () => fixture.nativeElement as HTMLElement;
  const botones = () => html().querySelectorAll<HTMLButtonElement>('button');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectorCantidad] }).compileComponents();

    fixture = TestBed.createComponent(SelectorCantidad);
    fixture.componentRef.setInput('cantidad', 2);
    sumas = 0;
    restas = 0;
    fixture.componentInstance.sumar.subscribe(() => sumas++);
    fixture.componentInstance.restar.subscribe(() => restas++);
    await fixture.whenStable();
  });

  it('muestra la cantidad', () => {
    expect(html().querySelector('span')?.textContent).toBe('2');
  });

  it('actualiza la cantidad cuando cambia', async () => {
    fixture.componentRef.setInput('cantidad', 5);
    await fixture.whenStable();

    expect(html().querySelector('span')?.textContent).toBe('5');
  });

  it('emite sumar al tocar +', () => {
    botones()[1].click();

    expect(sumas).toBe(1);
    expect(restas).toBe(0);
  });

  it('emite restar al tocar −', () => {
    botones()[0].click();

    expect(restas).toBe(1);
    expect(sumas).toBe(0);
  });

  it('no emite nada por sí solo', () => {
    expect(sumas + restas).toBe(0);
  });
});
