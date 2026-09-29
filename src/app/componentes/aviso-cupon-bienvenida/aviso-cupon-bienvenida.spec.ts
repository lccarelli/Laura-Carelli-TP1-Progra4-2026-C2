import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AvisoCuponBienvenida } from './aviso-cupon-bienvenida';

describe('AvisoCuponBienvenida', () => {
  let component: AvisoCuponBienvenida;
  let fixture: ComponentFixture<AvisoCuponBienvenida>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvisoCuponBienvenida],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AvisoCuponBienvenida);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
