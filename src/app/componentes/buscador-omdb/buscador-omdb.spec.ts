import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { BuscadorOmdb } from './buscador-omdb';

describe('BuscadorOmdb', () => {
  it('se crea', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const fixture = TestBed.createComponent(BuscadorOmdb);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
