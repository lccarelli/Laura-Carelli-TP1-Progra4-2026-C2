import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvisoEdad } from './aviso-edad';

describe('AvisoEdad', () => {
  let fixture: ComponentFixture<AvisoEdad>;

  const html = () => fixture.nativeElement as HTMLElement;
  const mostrar = async (restriccion: number | null) => {
    fixture.componentRef.setInput('restriccion', restriccion);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvisoEdad] }).compileComponents();
    fixture = TestBed.createComponent(AvisoEdad);
  });

  it('muestra la insignia con la edad mínima', async () => {
    await mostrar(16);

    expect(html().querySelector('.insignia')?.textContent).toBe('+16');
  });

  it('avisa que hay que ir con un adulto cuando hay restricción', async () => {
    await mostrar(13);

    expect(html().querySelector('.aviso-adulto')?.textContent).toContain(
      'Esta función es +13: debe ir acompañado de un adulto responsable.',
    );
  });

  it('muestra "Sin restricción" y ningún aviso si no hay edad mínima', async () => {
    await mostrar(null);

    expect(html().querySelector('.insignia')?.textContent).toBe('Sin restricción');
    expect(html().querySelector('.aviso-adulto')).toBeNull();
  });
});
