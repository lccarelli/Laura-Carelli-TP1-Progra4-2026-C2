import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectorChips } from './selector-chips';

describe('SelectorChips', () => {
  let fixture: ComponentFixture<SelectorChips>;
  let alternados: (string | number)[];

  const botones = () => [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
  ];
  const poner = async (datos: Record<string, unknown>) => {
    Object.entries(datos).forEach(([nombre, valor]) =>
      fixture.componentRef.setInput(nombre, valor),
    );
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectorChips] }).compileComponents();
    fixture = TestBed.createComponent(SelectorChips);
    alternados = [];
    fixture.componentInstance.alternar.subscribe((valor) => alternados.push(valor));
    await poner({
      opciones: [
        { valor: 1, etiqueta: 'Lun' },
        { valor: 'sab', etiqueta: 'Sáb' },
      ],
    });
  });

  it('muestra una opción por etiqueta', () => {
    expect(botones().map((b) => b.textContent?.trim())).toEqual(['Lun', 'Sáb']);
  });

  it('marca como activas las opciones seleccionadas', async () => {
    await poner({ seleccionados: new Set<string | number>(['sab']) });

    expect(botones().map((b) => b.classList.contains('chips__boton--activo'))).toEqual([
      false,
      true,
    ]);
  });

  it('emite el valor de la opción tocada, sea número o texto', () => {
    botones()[0].click();
    botones()[1].click();

    expect(alternados).toEqual([1, 'sab']);
  });

  it('usa la variante rectangular cuando se pide', async () => {
    expect(botones()[0].classList).not.toContain('chips__boton--rectangular');

    await poner({ variante: 'rectangular' });

    expect(botones()[0].classList).toContain('chips__boton--rectangular');
  });
});
