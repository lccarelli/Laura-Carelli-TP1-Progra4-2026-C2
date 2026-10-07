import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { OmdbDetalle } from '../../interfaces/omdb';
import {
  BUSQUEDA_MATRIX,
  DEMASIADOS_RESULTADOS,
  DETALLE_MATRIX,
  ID_INEXISTENTE,
  SIN_RESULTADOS,
} from '../../servicios/omdb/omdb.fixtures';
import { BuscadorOmdb } from './buscador-omdb';

const ESPERA_TIPEO_MS = 400;
const LINK_IMDB = 'https://www.imdb.com/title/tt0133093/';

describe('BuscadorOmdb', () => {
  let fixture: ComponentFixture<BuscadorOmdb>;
  let controlador: HttpTestingController;
  let elegidas: OmdbDetalle[];

  const html = () => fixture.nativeElement as HTMLElement;
  const estado = () => html().querySelector('.buscador-omdb__estado')?.textContent?.trim();
  const candidatos = () => html().querySelectorAll<HTMLButtonElement>('.candidato');
  const peticiones = () => controlador.match((r) => r.url === environment.OMDB_URL);
  const peticion = () => controlador.expectOne((r) => r.url === environment.OMDB_URL);

  const escribir = (texto: string, espera = ESPERA_TIPEO_MS) => {
    const input = html().querySelector('input') as HTMLInputElement;
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(espera);
    fixture.detectChanges();
  };

  const buscarMatrix = () => {
    escribir('matrix');
    peticion().flush(BUSQUEDA_MATRIX);
    fixture.detectChanges();
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(BuscadorOmdb);
    controlador = TestBed.inject(HttpTestingController);
    elegidas = [];
    fixture.componentInstance.elegida.subscribe((detalle) => elegidas.push(detalle));
    fixture.detectChanges();
  });

  afterEach(() => {
    controlador.verify();
    vi.useRealTimers();
  });

  describe('búsqueda por título', () => {
    it('no busca con menos de 3 caracteres', () => {
      escribir('ma');

      expect(peticiones()).toHaveLength(0);
    });

    it('espera a que se termine de tipear antes de buscar', () => {
      escribir('mat', ESPERA_TIPEO_MS - 1);
      expect(peticiones()).toHaveLength(0);

      vi.advanceTimersByTime(1);

      const req = peticion();
      expect(req.request.params.get('s')).toBe('mat');
      req.flush(BUSQUEDA_MATRIX);
    });

    it('avisa que está buscando mientras espera la respuesta', () => {
      escribir('matrix');

      expect(estado()).toBe('Buscando…');
      peticion().flush(BUSQUEDA_MATRIX);
    });

    it('muestra los candidatos de la búsqueda de matrix', () => {
      buscarMatrix();

      expect(candidatos()).toHaveLength(10);
      expect(candidatos()[0].textContent).toContain('The Matrix');
      expect(estado()).toBeUndefined();
    });

    it('avisa cuando no se encontraron películas', () => {
      escribir('zzzzqxj');
      peticion().flush(SIN_RESULTADOS);
      fixture.detectChanges();

      expect(estado()).toBe('No se encontraron películas.');
      expect(candidatos()).toHaveLength(0);
    });

    it('muestra el mensaje de OMDb cuando la búsqueda falla', () => {
      escribir('aaa');
      peticion().flush(DEMASIADOS_RESULTADOS);
      fixture.detectChanges();

      expect(estado()).toBe('Too many results.');
      expect(candidatos()).toHaveLength(0);
    });

    it('limpia la lista al borrar el texto', () => {
      buscarMatrix();

      escribir('');

      expect(candidatos()).toHaveLength(0);
    });
  });

  describe('link de IMDb', () => {
    it('trae el detalle por id y lo elige directo', () => {
      escribir(LINK_IMDB);

      const req = peticion();
      expect(req.request.params.get('i')).toBe('tt0133093');
      req.flush(DETALLE_MATRIX);
      fixture.detectChanges();

      expect(elegidas).toHaveLength(1);
      expect(elegidas[0].imdbID).toBe('tt0133093');
      expect(candidatos()).toHaveLength(0);
    });
  });

  describe('elegir()', () => {
    beforeEach(() => buscarMatrix());

    it('trae el detalle del candidato y lo emite', () => {
      candidatos()[0].click();
      fixture.detectChanges();
      expect(estado()).toBe('Buscando…');

      const req = peticion();
      expect(req.request.params.get('i')).toBe('tt0133093');
      expect(req.request.params.get('plot')).toBe('full');
      req.flush(DETALLE_MATRIX);
      fixture.detectChanges();

      expect(elegidas).toEqual([DETALLE_MATRIX]);
      expect(candidatos()).toHaveLength(0);
      expect(estado()).toBeUndefined();
    });

    it('muestra el error y no emite si el detalle falla', () => {
      candidatos()[0].click();
      peticion().flush(ID_INEXISTENTE);
      fixture.detectChanges();

      expect(estado()).toBe('Error getting data.');
      expect(elegidas).toHaveLength(0);
    });

    it('cancela la elección anterior si se elige otro candidato', () => {
      candidatos()[0].click();
      candidatos()[1].click();

      const [primera, segunda] = peticiones();
      expect(primera.cancelled).toBe(true);
      expect(segunda.cancelled).toBe(false);
      segunda.flush(DETALLE_MATRIX);
    });

    it('cancela la elección en curso al destruirse', () => {
      candidatos()[0].click();

      fixture.destroy();

      const [req] = peticiones();
      expect(req.cancelled).toBe(true);
    });
  });
});
