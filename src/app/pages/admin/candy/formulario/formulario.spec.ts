import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormularioCandy } from './formulario';

describe('FormularioCandy', () => {
  let component: FormularioCandy;
  let fixture: ComponentFixture<FormularioCandy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormularioCandy],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioCandy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
