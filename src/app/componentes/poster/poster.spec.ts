import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Poster } from './poster';

describe('Poster', () => {
  let fixture: ComponentFixture<Poster>;

  const html = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Poster] }).compileComponents();
    fixture = TestBed.createComponent(Poster);
  });

  it('muestra la imagen cuando hay', async () => {
    fixture.componentRef.setInput('imagen', 'matrix.png');
    await fixture.whenStable();

    expect(html().querySelector('img')?.getAttribute('src')).toBe('matrix.png');
  });

  it('muestra un recuadro vacío cuando no hay imagen', async () => {
    await fixture.whenStable();

    expect(html().querySelector('img')).toBeNull();
    expect(html().querySelector('.poster--vacia')).not.toBeNull();
  });

  it('cambia al recibir una imagen nueva', async () => {
    fixture.componentRef.setInput('imagen', null);
    await fixture.whenStable();
    fixture.componentRef.setInput('imagen', 'nueva.png');
    await fixture.whenStable();

    expect(html().querySelector('img')?.getAttribute('src')).toBe('nueva.png');
  });
});
