import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BotonLink } from './boton-link';

describe('BotonLink', () => {
  let component: BotonLink;
  let fixture: ComponentFixture<BotonLink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BotonLink],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BotonLink);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ruta', '/login');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
