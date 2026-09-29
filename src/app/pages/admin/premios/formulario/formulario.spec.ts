import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormularioPremio } from './formulario';

describe('FormularioPremio', () => {
  let component: FormularioPremio;
  let fixture: ComponentFixture<FormularioPremio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioPremio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioPremio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
