import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ButacaDeEntrada, EntradaServicio } from '../../../servicios/entrada/entrada';
import { CompraParaValidar, CompraServicio } from '../../../servicios/compra/compra';
import { Errores } from '../../../servicios/errores/errores';
import { Flujo } from '../../../servicios/logger/flujo';
import { Logger } from '../../../servicios/logger/logger';
import { TipoEvento } from '../../../servicios/logger/tipo-evento';
import { Boleteria } from './boleteria';

const COMPRA = {
  id: 'c1',
  codigo_compra: 'ABCD2345',
  cancelada_en: null,
  funcion: {
    inicio: '2026-10-10T20:30:00',
    pelicula: { nombre: 'Matrix' },
    sala: { nombre: 'Sala 1' },
  },
} as CompraParaValidar;

const butaca = (id: string, numero: number, validada_en: string | null = null) =>
  ({ id, validada_en, butaca: { fila: 'A', numero, tipo: 'normal' } }) as ButacaDeEntrada;

describe('Boleteria', () => {
  let fixture: ComponentFixture<Boleteria>;
  let buscarPorCodigo: ReturnType<typeof vi.fn>;
  let enviarPushDeUso: ReturnType<typeof vi.fn>;
  let listarPorCodigoCompra: ReturnType<typeof vi.fn>;
  let validar: ReturnType<typeof vi.fn>;
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
    listarPorCodigoCompra = vi.fn().mockResolvedValue({ data: [butaca('e1', 1), butaca('e2', 2)] });
    validar = vi.fn().mockResolvedValue({ error: null });
    mostrar = vi.fn();
    registrar = vi.fn();

    await TestBed.configureTestingModule({
      imports: [Boleteria],
      providers: [
        provideRouter([]),
        DatePipe,
        { provide: CompraServicio, useValue: { buscarPorCodigo, enviarPushDeUso } },
        { provide: EntradaServicio, useValue: { listarPorCodigoCompra, validar } },
        { provide: Errores, useValue: { mostrar } },
        { provide: Logger, useValue: { registrar } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Boleteria);
    fixture.detectChanges();
  });

  it('avisa si el código no existe y no valida nada', async () => {
    buscarPorCodigo.mockResolvedValue({ data: null, error: null });

    await escanear('NOEXISTE');

    expect(html().textContent).toContain('Código no encontrado.');
    expect(validar).not.toHaveBeenCalled();
  });

  it('si falla la lectura de las entradas muestra el error y no valida nada', async () => {
    listarPorCodigoCompra.mockResolvedValue({
      data: null,
      error: { message: 'columna inexistente' },
    });

    await escanear();

    expect(mostrar).toHaveBeenCalledWith('columna inexistente');
    expect(validar).not.toHaveBeenCalled();
    expect(html().textContent).not.toContain('Esta compra no tiene');
    expect(aviso()).toBeNull();
  });

  describe('primer escaneo', () => {
    it('valida todas las entradas pendientes de una vez', async () => {
      await escanear();

      expect(validar).toHaveBeenCalledTimes(1);
      expect(validar).toHaveBeenCalledWith('ABCD2345', ['e1', 'e2']);
    });

    it('muestra el aviso de ingreso validado con la cantidad', async () => {
      await escanear();

      expect(textoAviso()).toContain('Ingreso validado');
      expect(textoAviso()).toContain('2 entradas registradas ahora.');
      expect(html().querySelector('app-aviso-uso img')?.getAttribute('src')).toBe('/checkbox.png');
    });

    it('marca cada butaca como ingresada', async () => {
      await escanear();

      const filas = Array.from(html().querySelectorAll('.boleteria__fila'));
      expect(filas).toHaveLength(2);
      expect(filas.every((fila) => fila.textContent?.includes('Ingresó el'))).toBe(true);
    });

    it('con una sola entrada habla en singular', async () => {
      listarPorCodigoCompra.mockResolvedValue({ data: [butaca('e1', 1)] });

      await escanear();

      expect(textoAviso()).toContain('1 entrada registrada ahora.');
    });

    it('registra el éxito en el log', async () => {
      await escanear();

      expect(registrar).toHaveBeenCalledWith(Flujo.ValidacionQr, TipoEvento.Exito, 'ABCD2345 (2)');
    });

    it('avisa por push al comprador', async () => {
      await escanear();

      expect(enviarPushDeUso).toHaveBeenCalledWith('ABCD2345', 'entrada');
    });

    it('si el push falla, el ingreso queda validado y se registra el error', async () => {
      enviarPushDeUso.mockResolvedValue({ error: { message: 'sin suscripción' } });

      await escanear();

      expect(textoAviso()).toContain('Ingreso validado');
      expect(registrar).toHaveBeenCalledWith(
        Flujo.AvisoPushUso,
        TipoEvento.Error,
        'sin suscripción',
      );
    });

    it('si el push lanza una excepción tampoco rompe nada', async () => {
      enviarPushDeUso.mockRejectedValue(new Error('red caída'));

      await escanear();

      expect(textoAviso()).toContain('Ingreso validado');
      expect(registrar).toHaveBeenCalledWith(
        Flujo.AvisoPushUso,
        TipoEvento.Error,
        'Error: red caída',
      );
    });
  });

  describe('código ya utilizado', () => {
    beforeEach(() => {
      listarPorCodigoCompra.mockResolvedValue({
        data: [butaca('e1', 1, '2026-10-10T20:10:00'), butaca('e2', 2, '2026-10-10T20:15:00')],
      });
    });

    it('no vuelve a validar y avisa que ya se usó, con el último ingreso', async () => {
      await escanear();

      expect(validar).not.toHaveBeenCalled();
      expect(textoAviso()).toContain('Este código ya fue utilizado');
      expect(textoAviso()).toContain('Ingresó el 10/10/2026 20:15.');
      expect(html().querySelector('app-aviso-uso img')?.getAttribute('src')).toBe('/checkbox.png');
    });

    it('no manda push de nuevo', async () => {
      await escanear();

      expect(enviarPushDeUso).not.toHaveBeenCalled();
    });

    it('el aviso usa el estilo de advertencia', async () => {
      await escanear();

      expect(html().querySelector('.aviso--usado')).not.toBeNull();
    });
  });

  it('escanear dos veces el mismo código valida una sola vez', async () => {
    await escanear();
    expect(textoAviso()).toContain('Ingreso validado');

    listarPorCodigoCompra.mockResolvedValue({
      data: [butaca('e1', 1, '2026-10-10T20:10:00'), butaca('e2', 2, '2026-10-10T20:10:00')],
    });
    await escanear();

    expect(validar).toHaveBeenCalledTimes(1);
    expect(enviarPushDeUso).toHaveBeenCalledTimes(1);
    expect(textoAviso()).toContain('Este código ya fue utilizado');
  });

  it('con entrada parcial valida sólo las que faltan', async () => {
    listarPorCodigoCompra.mockResolvedValue({
      data: [butaca('e1', 1, '2026-10-10T20:10:00'), butaca('e2', 2)],
    });

    await escanear();

    expect(validar).toHaveBeenCalledWith('ABCD2345', ['e2']);
  });

  it('no valida una compra cancelada', async () => {
    buscarPorCodigo.mockResolvedValue({
      data: { ...COMPRA, cancelada_en: '2026-10-09T10:00:00' },
      error: null,
    });

    await escanear();

    expect(html().textContent).toContain('Esta compra fue cancelada');
    expect(validar).not.toHaveBeenCalled();
    expect(aviso()).toBeNull();
  });

  it('no valida si la compra no tiene entradas', async () => {
    listarPorCodigoCompra.mockResolvedValue({ data: [] });

    await escanear();

    expect(validar).not.toHaveBeenCalled();
    expect(aviso()).toBeNull();
  });

  describe('si el servidor rechaza la validación', () => {
    it('y otro puesto ya las había usado, lo muestra como ya utilizado sin error', async () => {
      listarPorCodigoCompra
        .mockResolvedValueOnce({ data: [butaca('e1', 1)] })
        .mockResolvedValueOnce({ data: [butaca('e1', 1, '2026-10-10T20:10:00')] });
      validar.mockResolvedValue({ error: { message: 'Esas entradas ya fueron utilizadas.' } });

      await escanear();

      expect(textoAviso()).toContain('Este código ya fue utilizado');
      expect(mostrar).not.toHaveBeenCalled();
      expect(enviarPushDeUso).not.toHaveBeenCalled();
    });

    it('y siguen pendientes, muestra el error y no avisa nada', async () => {
      validar.mockResolvedValue({ error: { message: 'No tenés permiso' } });

      await escanear();

      expect(mostrar).toHaveBeenCalledWith('No tenés permiso');
      expect(registrar).toHaveBeenCalledWith(
        Flujo.ValidacionQr,
        TipoEvento.Error,
        'No tenés permiso',
      );
      expect(aviso()).toBeNull();
      expect(enviarPushDeUso).not.toHaveBeenCalled();
    });
  });

  it('escribir el código y tocar Buscar valida igual que escanearlo', async () => {
    const campo = html().querySelector<HTMLInputElement>('input')!;
    campo.value = 'abcd2345';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    html().querySelector<HTMLButtonElement>('button')!.click();
    await new Promise((resolver) => setTimeout(resolver));
    fixture.detectChanges();

    expect(buscarPorCodigo).toHaveBeenCalledWith('ABCD2345');
    expect(validar).toHaveBeenCalledWith('ABCD2345', ['e1', 'e2']);
  });
});
