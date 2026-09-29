import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Premios } from './premios';

describe('Premios', () => {
  let component: Premios;
  let fixture: ComponentFixture<Premios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Premios],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Premios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
