import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Generos } from './generos';

describe('Generos', () => {
  let component: Generos;
  let fixture: ComponentFixture<Generos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Generos],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Generos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
