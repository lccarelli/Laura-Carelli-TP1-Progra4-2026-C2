import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EstadoPunto } from './estado-punto';

describe('EstadoPunto', () => {
  let component: EstadoPunto;
  let fixture: ComponentFixture<EstadoPunto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoPunto],
    }).compileComponents();

    fixture = TestBed.createComponent(EstadoPunto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
