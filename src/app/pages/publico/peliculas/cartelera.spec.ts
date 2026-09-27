import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Cartelera } from './cartelera';

describe('Cartelera', () => {
  let component: Cartelera;
  let fixture: ComponentFixture<Cartelera>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cartelera],
      providers: [provideRouter([]), DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(Cartelera);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
