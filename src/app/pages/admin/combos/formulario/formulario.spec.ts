import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormularioCombo } from './formulario';

describe('FormularioCombo', () => {
  let component: FormularioCombo;
  let fixture: ComponentFixture<FormularioCombo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioCombo],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioCombo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
