import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Funcion } from '../../../interfaces/funcion';
import { Errores } from '../../../servicios/errores/errores';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { Logger } from '../../../servicios/logger/logger';
import { Flujo } from '../../../servicios/logger/flujo';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { Funciones } from './funciones';

const funcion = (id: string, peliculaId: string, activa = true) =>
  ({ id, pelicula_id: peliculaId, activa }) as Funcion;

describe('Funciones', () => {
  let fixture: ComponentFixture<Funciones>;
  let listar: ReturnType<typeof vi.fn>;
  let eliminarDePelicula: ReturnType<typeof vi.fn>;
  let mostrar: ReturnType<typeof vi.fn>;
  let registrar: ReturnType<typeof vi.fn>;

  const asentar = async () => {
    await new Promise((resolver) => setTimeout(resolver));
    fixture.detectChanges();
  };

  const html = () => fixture.nativeElement as HTMLElement;
  const filas = () => Array.from(html().querySelectorAll('tbody tr'));
  const boton = (etiqueta: string) =>
    html().querySelector<HTMLButtonElement>(`button[aria-label="${etiqueta}"]`);
  const botonConTexto = (texto: string) =>
    Array.from(html().querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes(texto),
    );

  const pedirEliminarMatrix = () => {
    boton('Eliminar las funciones de Matrix')!.click();
    fixture.detectChanges();
  };

  const confirmar = async () => {
    botonConTexto('Eliminar')!.click();
    await asentar();
  };

  beforeEach(async () => {
    listar = vi.fn().mockResolvedValue({
      data: [funcion('a', 'p1'), funcion('b', 'p1'), funcion('c', 'p2', false)],
    });
    eliminarDePelicula = vi.fn().mockResolvedValue({ eliminadas: 2, conservadas: 0 });
    mostrar = vi.fn();
    registrar = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Funciones],
      providers: [
        provideRouter([]),
        DatePipe,
        { provide: FuncionServicio, useValue: { listar, eliminarDePelicula } },
        {
          provide: PeliculaServicio,
          useValue: {
            listar: () =>
              Promise.resolve({
                data: [
                  { id: 'p1', nombre: 'Matrix' },
                  { id: 'p2', nombre: 'Alien' },
                ],
              }),
          },
        },
        { provide: Errores, useValue: { mostrar } },
        { provide: Logger, useValue: { registrar } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Funciones);
    fixture.detectChanges();
    await asentar();
  });

  it('agrupa las funciones por película con su cantidad', () => {
    const celdas = filas().map((fila) =>
      Array.from(fila.querySelectorAll('td.tabla__nombre, td:nth-child(3)')).map((c) =>
        c.textContent?.trim(),
      ),
    );

    expect(celdas).toEqual([
      ['Alien', '1'],
      ['Matrix', '2'],
    ]);
  });

  it('tiene un botón de eliminar por película', () => {
    expect(boton('Eliminar las funciones de Matrix')).toBeTruthy();
    expect(boton('Eliminar las funciones de Alien')).toBeTruthy();
  });

  describe('eliminar las funciones de una película', () => {
    it('pide confirmación con la cantidad y no borra todavía', () => {
      pedirEliminarMatrix();

      expect(html().querySelector('app-confirmar-accion')?.textContent).toContain(
        '¿Eliminar las 2 funciones de Matrix?',
      );
      expect(eliminarDePelicula).not.toHaveBeenCalled();
    });

    it('cancelar cierra la confirmación sin borrar', () => {
      pedirEliminarMatrix();

      botonConTexto('Cancelar')!.click();
      fixture.detectChanges();

      expect(html().querySelector('app-confirmar-accion')).toBeNull();
      expect(eliminarDePelicula).not.toHaveBeenCalled();
    });

    it('confirmar borra las de esa película y recarga la tabla', async () => {
      pedirEliminarMatrix();

      await confirmar();

      expect(eliminarDePelicula).toHaveBeenCalledWith('p1');
      expect(listar).toHaveBeenCalledTimes(2);
      expect(html().querySelector('app-confirmar-accion')).toBeNull();
      expect(registrar).toHaveBeenCalledWith(
        Flujo.BajaFuncion,
        TipoEvento.Exito,
        'Matrix: 2 funciones',
      );
    });

    it('muestra el pochoclo girando mientras elimina y lo saca al terminar', async () => {
      let terminar!: (resultado: unknown) => void;
      eliminarDePelicula.mockReturnValue(new Promise((resolver) => (terminar = resolver)));
      pedirEliminarMatrix();

      botonConTexto('Eliminar')!.click();
      fixture.detectChanges();

      expect(html().querySelector('.overlay-cargando app-cargando')).not.toBeNull();

      terminar({ eliminadas: 2, conservadas: 0 });
      await asentar();

      expect(html().querySelector('.overlay-cargando')).toBeNull();
    });

    it('avisa si alguna se conservó por tener compras', async () => {
      eliminarDePelicula.mockResolvedValue({ eliminadas: 1, conservadas: 1 });
      pedirEliminarMatrix();

      await confirmar();

      expect(mostrar).toHaveBeenCalledWith(expect.stringContaining('tiene compras registradas'));
    });

    it('si falla muestra el error y mantiene la confirmación', async () => {
      eliminarDePelicula.mockResolvedValue({
        eliminadas: 0,
        conservadas: 0,
        error: { message: 'sin permiso' },
      });
      pedirEliminarMatrix();

      await confirmar();

      expect(mostrar).toHaveBeenCalledWith('sin permiso');
      expect(registrar).toHaveBeenCalledWith(Flujo.BajaFuncion, TipoEvento.Error, 'sin permiso');
      expect(html().querySelector('app-confirmar-accion')).not.toBeNull();
      expect(listar).toHaveBeenCalledTimes(1);
    });
  });
});
