import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoPunto } from './estado-punto';

describe('EstadoPunto', () => {
  let fixture: ComponentFixture<EstadoPunto>;

  const punto = () => (fixture.nativeElement as HTMLElement).querySelector('.estado-punto')!;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EstadoPunto] }).compileComponents();
    fixture = TestBed.createComponent(EstadoPunto);
  });

  it('está desactivado por defecto', async () => {
    await fixture.whenStable();

    expect(punto().classList).toContain('estado-punto--inactiva');
    expect(punto().getAttribute('title')).toBe('Desactivada');
    expect(punto().getAttribute('aria-label')).toBe('Desactivada');
  });

  it('se muestra activo cuando corresponde', async () => {
    fixture.componentRef.setInput('activa', true);
    await fixture.whenStable();

    expect(punto().classList).toContain('estado-punto--activa');
    expect(punto().classList).not.toContain('estado-punto--inactiva');
    expect(punto().getAttribute('title')).toBe('Activa');
  });
});
