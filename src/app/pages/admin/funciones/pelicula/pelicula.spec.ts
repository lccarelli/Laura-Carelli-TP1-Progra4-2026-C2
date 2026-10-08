import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Funcion } from '../../../../interfaces/funcion';
import { Errores } from '../../../../servicios/errores/errores';
import { FuncionServicio } from '../../../../servicios/funcion/funcion';
import { Logger } from '../../../../servicios/logger/logger';
import { Flujo } from '../../../../servicios/logger/flujo';
import { TipoEvento } from '../../../../servicios/logger/tipo-evento';
import { PeliculaServicio } from '../../../../servicios/pelicula/pelicula';
import { SalaServicio } from '../../../../servicios/sala/sala';
import { FuncionesPelicula } from './pelicula';

const funcion = (id: string): Funcion => ({
  id,
  pelicula_id: 'p1',
  sala_id: 's1',
  inicio: '2026-10-20T20:00:00',
  fin: '2026-10-20T22:16:00',
  formato: '2d',
  idioma: 'castellano',
  activa: true,
  precio_normal: 4000,
  precio_accesible: 4000,
  precio_vip: 6000,
});

describe('FuncionesPelicula', () => {
  let fixture: ComponentFixture<FuncionesPelicula>;
  let listarPorPelicula: ReturnType<typeof vi.fn>;
  let eliminarVarias: ReturnType<typeof vi.fn>;
  let mostrar: ReturnType<typeof vi.fn>;
  let registrar: ReturnType<typeof vi.fn>;

  const asentar = async () => {
    await new Promise((resolver) => setTimeout(resolver));
    fixture.detectChanges();
  };

  const html = () => fixture.nativeElement as HTMLElement;
  const checks = () => Array.from(html().querySelectorAll<HTMLInputElement>('tbody input'));
  const checkTodas = () => html().querySelector<HTMLInputElement>('thead input')!;
  const boton = (etiqueta: string) =>
    html().querySelector<HTMLButtonElement>(`button[aria-label="${etiqueta}"]`);
  const botonConTexto = (texto: string) =>
    Array.from(html().querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes(texto),
    );

  const marcar = async (input: HTMLInputElement) => {
    input.click();
    fixture.detectChanges();
    await asentar();
  };

  const confirmar = async () => {
    botonConTexto('Eliminar')!.click();
    await asentar();
  };

  beforeEach(async () => {
    listarPorPelicula = vi
      .fn()
      .mockResolvedValue({ data: [funcion('a'), funcion('b'), funcion('c')] });
    eliminarVarias = vi.fn().mockResolvedValue({ eliminadas: 2, conservadas: 0 });
    mostrar = vi.fn();
    registrar = vi.fn();

    await TestBed.configureTestingModule({
      imports: [FuncionesPelicula],
      providers: [
        provideRouter([]),
        DatePipe,
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'p1' } } } },
        { provide: FuncionServicio, useValue: { listarPorPelicula, eliminarVarias } },
        {
          provide: PeliculaServicio,
          useValue: {
            buscarPorId: () => Promise.resolve({ data: { id: 'p1', nombre: 'Matrix' } }),
          },
        },
        {
          provide: SalaServicio,
          useValue: { listar: () => Promise.resolve({ data: [{ id: 's1', nombre: 'Sala 1' }] }) },
        },
        { provide: Errores, useValue: { mostrar } },
        { provide: Logger, useValue: { registrar } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FuncionesPelicula);
    fixture.detectChanges();
    await asentar();
  });

  it('lista una fila con casilla por cada función', () => {
    expect(checks()).toHaveLength(3);
  });

  it('no muestra la barra de selección si no hay nada elegido', () => {
    expect(html().querySelector('.seleccion')).toBeNull();
  });

  it('muestra cuántas hay elegidas al marcar', async () => {
    await marcar(checks()[0]);
    expect(html().querySelector('.seleccion__cantidad')?.textContent).toContain('1 seleccionada');

    await marcar(checks()[1]);
    expect(html().querySelector('.seleccion__cantidad')?.textContent).toContain('2 seleccionadas');
  });

  it('"seleccionar todas" marca todas y al repetirlo las desmarca', async () => {
    await marcar(checkTodas());

    expect(checks().every((c) => c.checked)).toBe(true);
    expect(checkTodas().checked).toBe(true);

    await marcar(checkTodas());

    expect(checks().some((c) => c.checked)).toBe(false);
  });

  it('la casilla general se destilda si se quita una', async () => {
    await marcar(checkTodas());

    await marcar(checks()[0]);

    expect(checkTodas().checked).toBe(false);
  });

  describe('eliminar', () => {
    beforeEach(async () => {
      await marcar(checks()[0]);
      await marcar(checks()[2]);
    });

    it('pide confirmación antes de borrar', () => {
      boton('Eliminar las funciones seleccionadas')!.click();
      fixture.detectChanges();

      expect(html().querySelector('app-confirmar-accion')?.textContent).toContain(
        '¿Eliminar 2 funciones?',
      );
      expect(eliminarVarias).not.toHaveBeenCalled();
    });

    it('cancelar cierra la confirmación y conserva la selección', () => {
      boton('Eliminar las funciones seleccionadas')!.click();
      fixture.detectChanges();

      botonConTexto('Cancelar')!.click();
      fixture.detectChanges();

      expect(html().querySelector('app-confirmar-accion')).toBeNull();
      expect(checks()[0].checked).toBe(true);
      expect(eliminarVarias).not.toHaveBeenCalled();
    });

    it('confirma, borra sólo las elegidas, recarga y limpia la selección', async () => {
      boton('Eliminar las funciones seleccionadas')!.click();
      fixture.detectChanges();

      await confirmar();

      expect(eliminarVarias).toHaveBeenCalledWith(['a', 'c']);
      expect(listarPorPelicula).toHaveBeenCalledTimes(2);
      expect(html().querySelector('.seleccion')).toBeNull();
      expect(html().querySelector('app-confirmar-accion')).toBeNull();
      expect(registrar).toHaveBeenCalledWith(
        Flujo.BajaFuncion,
        TipoEvento.Exito,
        'Matrix: 2 funciones',
      );
    });

    it('muestra el pochoclo girando mientras elimina y lo saca al terminar', async () => {
      let terminar!: (resultado: unknown) => void;
      eliminarVarias.mockReturnValue(new Promise((resolver) => (terminar = resolver)));
      boton('Eliminar las funciones seleccionadas')!.click();
      fixture.detectChanges();

      botonConTexto('Eliminar')!.click();
      fixture.detectChanges();

      expect(html().querySelector('.overlay-cargando app-cargando')).not.toBeNull();

      terminar({ eliminadas: 2, conservadas: 0 });
      await asentar();

      expect(html().querySelector('.overlay-cargando')).toBeNull();
    });

    it('avisa si alguna se conservó por tener compras', async () => {
      eliminarVarias.mockResolvedValue({ eliminadas: 1, conservadas: 1 });
      boton('Eliminar las funciones seleccionadas')!.click();
      fixture.detectChanges();

      await confirmar();

      expect(mostrar).toHaveBeenCalledWith(expect.stringContaining('tiene compras registradas'));
    });

    it('si falla muestra el error y deja la selección para reintentar', async () => {
      eliminarVarias.mockResolvedValue({
        eliminadas: 0,
        conservadas: 2,
        error: { message: 'sin permiso' },
      });
      boton('Eliminar las funciones seleccionadas')!.click();
      fixture.detectChanges();

      await confirmar();

      expect(mostrar).toHaveBeenCalledWith('sin permiso');
      expect(registrar).toHaveBeenCalledWith(Flujo.BajaFuncion, TipoEvento.Error, 'sin permiso');
      expect(checks()[0].checked).toBe(true);
      expect(listarPorPelicula).toHaveBeenCalledTimes(1);
    });

    it('si se destilda todo con la confirmación abierta, ésta se cierra', async () => {
      boton('Eliminar las funciones seleccionadas')!.click();
      fixture.detectChanges();

      await marcar(checks()[0]);
      await marcar(checks()[2]);

      expect(html().querySelector('app-confirmar-accion')).toBeNull();
    });
  });
});
