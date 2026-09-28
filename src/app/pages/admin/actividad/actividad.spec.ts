import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Actividad } from './actividad';

describe('Actividad', () => {
  let component: Actividad;
  let fixture: ComponentFixture<Actividad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Actividad],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Actividad);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
