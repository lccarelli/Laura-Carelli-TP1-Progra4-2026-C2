import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { omdbInterceptor } from './omdb-interceptor';

describe('omdbInterceptor', () => {
  let http: HttpClient;
  let controlador: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([omdbInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  it('agrega la apikey a las peticiones a OMDb', () => {
    http.get(environment.OMDB_URL, { params: { s: 'matrix' } }).subscribe();

    const req = controlador.expectOne((r) => r.url === environment.OMDB_URL);
    expect(req.request.params.get('apikey')).toBe(environment.OMDB_KEY);
    expect(req.request.params.get('s')).toBe('matrix');
    req.flush({ Response: 'True' });
  });

  it('no toca las peticiones a otras URLs', () => {
    http.get('https://otra-api.com/datos').subscribe();

    const req = controlador.expectOne('https://otra-api.com/datos');
    expect(req.request.params.has('apikey')).toBe(false);
    req.flush({});
  });
});
