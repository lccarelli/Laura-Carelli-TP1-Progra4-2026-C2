import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CompraParaValidar, CompraServicio } from '../../../servicios/compra/compra';
import { CompraCandyServicio } from '../../../servicios/compra-candy/compra-candy';
import { CompraComboServicio } from '../../../servicios/compra-combo/compra-combo';
import { Errores } from '../../../servicios/errores/errores';
import { Flujo } from '../../../servicios/logger/flujo';
import { Logger } from '../../../servicios/logger/logger';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { EntregaCandy } from './entrega-candy';

const COMPRA = {
  id: 'c1',
  codigo_compra: 'ABCD2345',
  cancelada_en: null,
  funcion: { inicio: '2026-10-10T20:30:00', pelicula: { nombre: 'Matrix' }, sala: null },
} as CompraParaValidar;

const candy = (id: string, nombre: string, cantidad: number, entregada = 0) => ({
  id,
  cantidad,
  cantidad_entregada: entregada,
  producto_candy: { nombre },
});

const combo = (id: string, nombre: string, cantidad: number, entregada = 0) => ({
  id,
  cantidad,
  cantidad_entregada: entregada,
  combo: { nombre },
});

describe('EntregaCandy', () => {
  let fixture: ComponentFixture<EntregaCandy>;
  let buscarPorCodigo: ReturnType<typeof vi.fn>;
  let enviarPushDeUso: ReturnType<typeof vi.fn>;
  let listarCandy: ReturnType<typeof vi.fn>;
  let listarCombos: ReturnType<typeof vi.fn>;
  let entregarPendientes: ReturnType<typeof vi.fn>;
  let mostrar: ReturnType<typeof vi.fn>;
  let registrar: ReturnType<typeof vi.fn>;

  const html = () => fixture.nativeElement as HTMLElement;
  const aviso = () => html().querySelector('app-aviso-uso');
  const textoAviso = () => aviso()?.textContent?.replace(/\s+/g, ' ').trim();

  const escanear = async (codigo = 'ABCD2345') => {
    await fixture.componentInstance.buscar(codigo);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    buscarPorCodigo = vi.fn().mockResolvedValue({ data: COMPRA, error: null });
    enviarPushDeUso = vi.fn().mockResolvedValue({ error: null });
    listarCandy = vi.fn().mockResolvedValue({ data: [candy('p1', 'Pochoclo', 2)] });
    listarCombos = vi.fn().mockResolvedValue({ data: [combo('k1', 'Combo Duo', 1)] });
    entregarPendientes = vi.fn().mockResolvedValue({ error: null });
    mostrar = vi.fn();
    registrar = vi.fn();

    await TestBed.configureTestingModule({
      imports: [EntregaCandy],
      providers: [
        provideRouter([]),
        DatePipe,
        { provide: CompraServicio, useValue: { buscarPorCodigo, enviarPushDeUso } },
        {
          provide: CompraCandyServicio,
          useValue: { listarPorCodigo: listarCandy, entregarPendientes },
        },
        { provide: CompraComboServicio, useValue: { listarPorCodigo: listarCombos } },
        { provide: Errores, useValue: { mostrar } },
        { provide: Logger, useValue: { registrar } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntregaCandy);
    fixture.detectChanges();
  });

  it('avisa si el código no existe y no entrega nada', async () => {
    buscarPorCodigo.mockResolvedValue({ data: null, error: null });

    await escanear('NOEXISTE');

    expect(html().textContent).toContain('Código no encontrado.');
    expect(entregarPendientes).not.toHaveBeenCalled();
  });

  it('si falla la lectura del candy muestra el error y no dice que no hay candy', async () => {
    listarCandy.mockResolvedValue({ data: null, error: { message: 'columna inexistente' } });

    await escanear();

    expect(mostrar).toHaveBeenCalledWith('columna inexistente');
    expect(entregarPendientes).not.toHaveBeenCalled();
    expect(html().textContent).not.toContain('Esta compra no tiene candy.');
    expect(aviso()).toBeNull();
  });

  describe('primer escaneo', () => {
    it('entrega todo lo pendiente con una sola llamada', async () => {
      await escanear();

      expect(entregarPendientes).toHaveBeenCalledTimes(1);
      expect(entregarPendientes).toHaveBeenCalledWith('ABCD2345');
    });

    it('muestra el aviso de candy entregado con el check', async () => {
      await escanear();

      expect(textoAviso()).toContain('Candy entregado');
      expect(html().querySelector('app-aviso-uso img')?.getAttribute('src')).toBe('/checkbox.png');
    });

    it('deja cada producto y combo como completo', async () => {
      await escanear();

      const filas = Array.from(html().querySelectorAll('.boleteria__fila')).map((fila) =>
        fila.textContent?.replace(/\s+/g, ' ').trim(),
      );
      expect(filas).toEqual([
        'Pochoclo: 2 de 2 entregados Completo ✔',
        'Combo Duo: 1 de 1 entregados Completo ✔',
      ]);
    });

    it('registra la entrega y avisa por push al comprador', async () => {
      await escanear();

      expect(registrar).toHaveBeenCalledWith(Flujo.EntregaCandy, TipoEvento.Exito, 'ABCD2345');
      expect(enviarPushDeUso).toHaveBeenCalledWith('ABCD2345', 'candy');
    });

    it('si el push falla, la entrega queda registrada y se anota el error', async () => {
      enviarPushDeUso.mockResolvedValue({ error: { message: 'sin suscripción' } });

      await escanear();

      expect(textoAviso()).toContain('Candy entregado');
      expect(registrar).toHaveBeenCalledWith(
        Flujo.AvisoPushUso,
        TipoEvento.Error,
        'sin suscripción',
      );
    });
  });

  describe('candy ya retirado', () => {
    beforeEach(() => {
      listarCandy.mockResolvedValue({ data: [candy('p1', 'Pochoclo', 2, 2)] });
      listarCombos.mockResolvedValue({ data: [combo('k1', 'Combo Duo', 1, 1)] });
    });

    it('no entrega de nuevo y avisa que ya se retiró', async () => {
      await escanear();

      expect(entregarPendientes).not.toHaveBeenCalled();
      expect(textoAviso()).toContain('Este candy ya fue retirado');
      expect(html().querySelector('.aviso--usado')).not.toBeNull();
    });

    it('no manda push de nuevo', async () => {
      await escanear();

      expect(enviarPushDeUso).not.toHaveBeenCalled();
    });
  });

  it('escanear dos veces el mismo código entrega una sola vez', async () => {
    await escanear();
    expect(textoAviso()).toContain('Candy entregado');

    listarCandy.mockResolvedValue({ data: [candy('p1', 'Pochoclo', 2, 2)] });
    listarCombos.mockResolvedValue({ data: [combo('k1', 'Combo Duo', 1, 1)] });
    await escanear();

    expect(entregarPendientes).toHaveBeenCalledTimes(1);
    expect(enviarPushDeUso).toHaveBeenCalledTimes(1);
    expect(textoAviso()).toContain('Este candy ya fue retirado');
  });

  it('con una entrega parcial previa entrega lo que falta', async () => {
    listarCandy.mockResolvedValue({ data: [candy('p1', 'Pochoclo', 2, 1)] });
    listarCombos.mockResolvedValue({ data: [] });

    await escanear();

    expect(entregarPendientes).toHaveBeenCalledTimes(1);
  });

  it('no entrega una compra cancelada', async () => {
    buscarPorCodigo.mockResolvedValue({
      data: { ...COMPRA, cancelada_en: '2026-10-09T10:00:00' },
      error: null,
    });

    await escanear();

    expect(html().textContent).toContain('Esta compra fue cancelada');
    expect(entregarPendientes).not.toHaveBeenCalled();
  });

  it('avisa si la compra no tiene candy', async () => {
    listarCandy.mockResolvedValue({ data: [] });
    listarCombos.mockResolvedValue({ data: [] });

    await escanear();

    expect(html().textContent).toContain('Esta compra no tiene candy.');
    expect(entregarPendientes).not.toHaveBeenCalled();
  });

  describe('si el servidor rechaza la entrega', () => {
    it('y otro puesto ya lo había entregado, lo muestra como retirado sin error', async () => {
      listarCandy
        .mockResolvedValueOnce({ data: [candy('p1', 'Pochoclo', 2)] })
        .mockResolvedValueOnce({ data: [candy('p1', 'Pochoclo', 2, 2)] });
      listarCombos.mockResolvedValue({ data: [] });
      entregarPendientes.mockResolvedValue({ error: { message: 'Este candy ya fue retirado.' } });

      await escanear();

      expect(textoAviso()).toContain('Este candy ya fue retirado');
      expect(mostrar).not.toHaveBeenCalled();
      expect(enviarPushDeUso).not.toHaveBeenCalled();
    });

    it('y siguen pendientes, muestra el error y no avisa nada', async () => {
      entregarPendientes.mockResolvedValue({ error: { message: 'No tenés permiso' } });

      await escanear();

      expect(mostrar).toHaveBeenCalledWith('No tenés permiso');
      expect(registrar).toHaveBeenCalledWith(
        Flujo.EntregaCandy,
        TipoEvento.Error,
        'No tenés permiso',
      );
      expect(aviso()).toBeNull();
      expect(enviarPushDeUso).not.toHaveBeenCalled();
    });
  });
});
