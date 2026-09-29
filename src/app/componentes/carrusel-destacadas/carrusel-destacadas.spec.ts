import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarruselDestacadas } from './carrusel-destacadas';

describe('CarruselDestacadas', () => {
  let component: CarruselDestacadas;
  let fixture: ComponentFixture<CarruselDestacadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarruselDestacadas],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CarruselDestacadas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
