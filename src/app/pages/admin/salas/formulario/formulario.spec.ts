import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormularioSala } from './formulario';

describe('FormularioSala', () => {
  let component: FormularioSala;
  let fixture: ComponentFixture<FormularioSala>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioSala],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioSala);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
