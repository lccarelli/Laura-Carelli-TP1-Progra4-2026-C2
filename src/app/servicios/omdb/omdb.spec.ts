import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import {
  BUSQUEDA_MATRIX,
  DEMASIADOS_RESULTADOS,
  DETALLE_MATRIX,
  ID_INEXISTENTE,
  KEY_INVALIDA,
  SIN_RESULTADOS,
} from './omdb.fixtures';
import { Omdb } from './omdb';

describe('Omdb', () => {
  let servicio: Omdb;
  let controlador: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(Omdb);
    controlador = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controlador.verify());

  const peticion = () => controlador.expectOne((r) => r.url === environment.OMDB_URL);

  describe('buscar', () => {
    it('busca películas por título, en la primera página por defecto', () => {
      servicio.buscar('matrix').subscribe();

      const { params } = peticion().request;
      expect(params.get('s')).toBe('matrix');
      expect(params.get('type')).toBe('movie');
      expect(params.get('page')).toBe('1');
    });

    it('busa la página indicada', () => {
      servicio.buscar('matrix', 2).subscribe();

      expect(peticion().request.params.get('page')).toBe('2');
    });

    it('devuelve los candidatos de la búsqueda de matrix', () => {
      let respuesta;
      servicio.buscar('matrix').subscribe((r) => (respuesta = r));

      peticion().flush(BUSQUEDA_MATRIX);

      expect(respuesta).toEqual(BUSQUEDA_MATRIX);
      expect(BUSQUEDA_MATRIX.Search).toHaveLength(10);
      expect(BUSQUEDA_MATRIX.Search[0].Title).toBe('The Matrix');
    });

    it('devuelve una búsqueda vacía cuando OMDb no encuentra nada', () => {
      let respuesta;
      servicio.buscar('zzzzqxj').subscribe((r) => (respuesta = r));

      peticion().flush(SIN_RESULTADOS);

      expect(respuesta).toEqual({ Response: 'True', Search: [], totalResults: '0' });
    });

    it('propaga el error cuando OMDb encuentra demasiados resultados', () => {
      let mensaje = '';
      servicio.buscar('a').subscribe({ error: (e: Error) => (mensaje = e.message) });

      peticion().flush(DEMASIADOS_RESULTADOS);

      expect(mensaje).toBe('Too many results.');
    });

    it('traduce el 401 de una key inválida con el mensaje de OMDb', () => {
      let mensaje = '';
      servicio.buscar('matrix').subscribe({ error: (e: Error) => (mensaje = e.message) });

      peticion().flush(KEY_INVALIDA, { status: 401, statusText: 'Unauthorized' });

      expect(mensaje).toBe('Invalid API key!');
    });

    it('avisa cuando no hay conexión', () => {
      let mensaje = '';
      servicio.buscar('matrix').subscribe({ error: (e: Error) => (mensaje = e.message) });

      peticion().error(new ProgressEvent('error'));

      expect(mensaje).toBe('Sin conexión con OMDb');
    });

    it('usa un mensaje genérico si el error HTTP no trae el mensaje de OMDb', () => {
      let mensaje = '';
      servicio.buscar('matrix').subscribe({ error: (e: Error) => (mensaje = e.message) });

      peticion().flush('Bad gateway', { status: 502, statusText: 'Bad Gateway' });

      expect(mensaje).toBe('No se pudo consultar OMDb');
    });
  });

  describe('detalle', () => {
    it('pide el detalle por id de IMDb con la sinopsis completa', () => {
      servicio.detalle('tt0133093').subscribe();

      const { params } = peticion().request;
      expect(params.get('i')).toBe('tt0133093');
      expect(params.get('plot')).toBe('full');
    });

    it('devuelve el detalle de The Matrix', () => {
      let respuesta;
      servicio.detalle('tt0133093').subscribe((r) => (respuesta = r));

      peticion().flush(DETALLE_MATRIX);

      expect(respuesta).toEqual(DETALLE_MATRIX);
      expect(DETALLE_MATRIX.imdbID).toBe('tt0133093');
    });

    it('propaga como error un id inexistente', () => {
      let mensaje = '';
      servicio.detalle('tt0000000').subscribe({ error: (e: Error) => (mensaje = e.message) });

      peticion().flush(ID_INEXISTENTE);

      expect(mensaje).toBe('Error getting data.');
    });

    it('usa un mensaje por defecto si OMDb no manda Error', () => {
      let mensaje = '';
      servicio.detalle('tt0133093').subscribe({ error: (e: Error) => (mensaje = e.message) });

      peticion().flush({ Response: 'False' });

      expect(mensaje).toBe('Error de OMDb');
    });
  });
});
