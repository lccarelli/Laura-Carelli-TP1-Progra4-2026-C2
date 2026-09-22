import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Funciones } from './funciones';

describe('Funciones', () => {
  let component: Funciones;
  let fixture: ComponentFixture<Funciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Funciones],
      providers: [provideRouter([]), DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(Funciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
