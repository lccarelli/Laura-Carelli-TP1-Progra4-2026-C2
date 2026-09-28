import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MisCompras } from './mis-compras';

describe('MisCompras', () => {
  let component: MisCompras;
  let fixture: ComponentFixture<MisCompras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisCompras],
      providers: [provideRouter([]), DatePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(MisCompras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
