import { TestBed } from '@angular/core/testing';
import { Errores } from './errores';

describe('Errores', () => {
  let service: Errores;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Errores);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
