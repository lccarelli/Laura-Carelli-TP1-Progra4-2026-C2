import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarjetaPelicula } from './tarjeta-pelicula';
import { Pelicula } from '../../interfaces/pelicula';

describe('TarjetaPelicula', () => {
  let component: TarjetaPelicula;
  let fixture: ComponentFixture<TarjetaPelicula>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaPelicula],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaPelicula);
    component = fixture.componentInstance;
    component.pelicula = {
      id: '1',
      nombre: 'Prueba',
      sinopsis: null,
      duracion_minutos: 90,
      imagen_url: null,
      restriccion_edad: null,
      activa: true,
      destacada: false,
      fecha_estreno: null,
    } as Pelicula;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
