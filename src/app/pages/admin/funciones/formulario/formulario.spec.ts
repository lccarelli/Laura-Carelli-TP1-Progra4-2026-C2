import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormularioFuncion } from './formulario';

describe('FormularioFuncion', () => {
  let component: FormularioFuncion;
  let fixture: ComponentFixture<FormularioFuncion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioFuncion],
      providers: [provideRouter([]), DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioFuncion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
