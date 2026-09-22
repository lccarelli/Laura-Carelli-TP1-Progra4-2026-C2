import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormularioGenero } from './formulario';

describe('FormularioGenero', () => {
  let component: FormularioGenero;
  let fixture: ComponentFixture<FormularioGenero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioGenero],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioGenero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
