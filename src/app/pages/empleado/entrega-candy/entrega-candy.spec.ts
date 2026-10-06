import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EntregaCandy } from './entrega-candy';

describe('EntregaCandy', () => {
  it('se crea', async () => {
    await TestBed.configureTestingModule({
      imports: [EntregaCandy],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EntregaCandy);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
