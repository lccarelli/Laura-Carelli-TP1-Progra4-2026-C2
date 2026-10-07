import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Butaca } from '../../../interfaces/butaca';
import { Cliente } from '../../../interfaces/cliente';
import { ConfiguracionCupon } from '../../../interfaces/configuracion-cupon';
import { Funcion } from '../../../interfaces/funcion';
import { Pelicula } from '../../../interfaces/pelicula';
import { Premio } from '../../../interfaces/premio';
import { ProductoCandy } from '../../../interfaces/producto-candy';
import { Auth } from '../../../servicios/auth/auth';
import { ClienteServicio } from '../../../servicios/cliente/cliente';
import { ComboServicio } from '../../../servicios/combo/combo';
import { ConfiguracionCuponServicio } from '../../../servicios/configuracion-cupon/configuracion-cupon';
import { EntradaServicio } from '../../../servicios/entrada/entrada';
import { Errores } from '../../../servicios/errores/errores';
import { FuncionServicio } from '../../../servicios/funcion/funcion';
import { PeliculaServicio } from '../../../servicios/pelicula/pelicula';
import { PremioServicio } from '../../../servicios/premio/premio';
import { ProcesoCompra } from '../../../servicios/proceso-compra/proceso-compra';
import { ProductoCandyServicio } from '../../../servicios/producto-candy/producto-candy';
import { ReservaButacas } from '../../../servicios/reserva-butacas/reserva-butacas';
import { SalaServicio } from '../../../servicios/sala/sala';
import { Detalle } from './detalle';

const FUNCION = {
  id: 'f1',
  pelicula_id: 'pe1',
  sala_id: 's1',
  inicio: '2026-10-14T20:30:00',
  formato: '2d',
  idioma: 'castellano',
  precio_normal: 4000,
  precio_accesible: 3000,
  precio_vip: 6000,
} as Funcion;

const PELICULA = {
  id: 'pe1',
  nombre: 'Matrix',
  imagen_url: null,
  restriccion_edad: null,
  fecha_estreno: null,
  dias_preventa: null,
  porcentaje_preventa: null,
} as Pelicula;

const BUTACAS = [
  { id: 'b1', sala_id: 's1', fila: 'A', numero: 1, bloque: 'centro', tipo: 'normal' },
  { id: 'b2', sala_id: 's1', fila: 'A', numero: 2, bloque: 'centro', tipo: 'vip' },
] as Butaca[];

const PRODUCTOS = [
  { id: 'p1', nombre: 'Pochoclo', precio: 2500, imagen_url: null, activo: true },
] as ProductoCandy[];

const CLIENTE = {
  id: 'u1',
  cupon_bienvenida_usado: false,
  puntos: 500,
  credito: 1000,
} as Cliente;

const CUPON = { id: 'global', porcentaje: 20, edad_minima: null } as ConfiguracionCupon;

const PREMIO = {
  id: 'pr1',
  nombre: 'Descuento 1500',
  costo_puntos: 100,
  dias_validos: null,
  cantidad_entradas: null,
  monto_descuento: 1500,
} as Premio;

const RESULTADO = {
  qr: 'data:image/png;base64,QR',
  descuentoCupon: 0,
  credito: 0,
  mailEnviado: true,
};

describe('Detalle', () => {
  let fixture: ComponentFixture<Detalle>;
  let usuario: ReturnType<typeof signal<unknown>>;
  let pelicula: Pelicula;
  let premios: Premio[];
  let errores: { mostrar: ReturnType<typeof vi.fn> };
  let funcionServicio: { buscarPorId: ReturnType<typeof vi.fn> };
  let clienteServicio: { obtenerOCrear: ReturnType<typeof vi.fn> };
  let procesoCompra: { completar: ReturnType<typeof vi.fn> };
  let entradaServicio: Record<string, ReturnType<typeof vi.fn>>;

  const html = () => fixture.nativeElement as HTMLElement;
  const texto = () => html().textContent?.replace(/\s+/g, ' ') ?? '';
  const reserva = () => fixture.debugElement.injector.get(ReservaButacas);
  const esperar = async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve();
    }
    await fixture.whenStable();
  };
  const botonCon = (contenido: string) =>
    [...html().querySelectorAll<HTMLButtonElement>('button')].find((boton) =>
      boton.textContent?.includes(contenido),
    );
  const tocar = async (contenido: string) => {
    botonCon(contenido)?.click();
    await esperar();
  };
  const elegirButacas = async (...ids: string[]) => {
    for (const id of ids) {
      await reserva().alternar(id);
    }
    await esperar();
  };
  const irAPago = async (...butacas: string[]) => {
    await elegirButacas(...(butacas.length ? butacas : ['b1']));
    await tocar('Siguiente');
    await tocar('Siguiente');
  };
  const escribirEmail = async (email: string) => {
    const campo = html().querySelector<HTMLInputElement>('input[type="email"]')!;
    campo.value = email;
    campo.dispatchEvent(new Event('input'));
    await esperar();
  };
  const crear = async () => {
    fixture = TestBed.createComponent(Detalle);
    await esperar();
  };
  const pedidoEnviado = () => procesoCompra.completar.mock.calls[0][0];

  beforeEach(async () => {
    usuario = signal<unknown>(null);
    pelicula = { ...PELICULA };
    premios = [];
    errores = { mostrar: vi.fn() };
    funcionServicio = { buscarPorId: vi.fn().mockResolvedValue({ data: FUNCION, error: null }) };
    clienteServicio = {
      obtenerOCrear: vi.fn().mockResolvedValue({ data: CLIENTE, error: null }),
    };
    procesoCompra = { completar: vi.fn().mockResolvedValue(RESULTADO) };
    entradaServicio = {
      sesionId: vi.fn().mockReturnValue('sesion-1'),
      listarPorFuncion: vi.fn().mockResolvedValue({ data: [], error: null }),
      reservar: vi.fn().mockResolvedValue({ error: null }),
      suscribirCambios: vi.fn().mockReturnValue('canal'),
      desuscribir: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Detalle],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'f1' } } } },
        { provide: FuncionServicio, useValue: funcionServicio },
        {
          provide: PeliculaServicio,
          useValue: { buscarPorId: () => Promise.resolve({ data: pelicula }) },
        },
        {
          provide: SalaServicio,
          useValue: {
            listar: () => Promise.resolve({ data: [{ id: 's1', nombre: 'Sala 1' }] }),
            listarButacas: () => Promise.resolve({ data: BUTACAS, error: null }),
          },
        },
        { provide: EntradaServicio, useValue: entradaServicio },
        {
          provide: ProductoCandyServicio,
          useValue: { listarActivos: () => Promise.resolve({ data: PRODUCTOS, error: null }) },
        },
        {
          provide: ComboServicio,
          useValue: { listarActivos: () => Promise.resolve({ data: [], error: null }) },
        },
        {
          provide: ConfiguracionCuponServicio,
          useValue: { obtener: () => Promise.resolve({ data: CUPON }) },
        },
        {
          provide: PremioServicio,
          useValue: { listarActivas: () => Promise.resolve({ data: premios }) },
        },
        { provide: ClienteServicio, useValue: clienteServicio },
        { provide: ProcesoCompra, useValue: procesoCompra },
        {
          provide: Auth,
          useValue: {
            usuario,
            esCliente: () =>
              (usuario() as { user_metadata?: { role?: string } })?.user_metadata?.role ===
              'cliente',
          },
        },
        { provide: Errores, useValue: errores },
      ],
    }).compileComponents();
  });

  const iniciarSesionComoCliente = () =>
    usuario.set({ id: 'u1', email: 'cliente@mail.com', user_metadata: { role: 'cliente' } });

  describe('carga', () => {
    it('muestra la función con película y sala', async () => {
      await crear();

      expect(texto()).toContain('Matrix');
      expect(texto()).toContain('Sala 1');
    });

    it('avisa si no se encuentra la función', async () => {
      funcionServicio.buscarPorId.mockResolvedValue({
        data: null,
        error: { message: 'No existe' },
      });

      await crear();

      expect(errores.mostrar).toHaveBeenCalledWith('No existe');
      expect(html().querySelector('app-ficha-funcion')).toBeNull();
    });

    it('empieza en la elección de butacas con el resto de los pasos bloqueados', async () => {
      await crear();

      const pestanas = [...html().querySelectorAll<HTMLButtonElement>('.compra__tab')];

      expect(html().querySelector('app-mapa-butacas')).not.toBeNull();
      expect(pestanas.map((p) => p.disabled)).toEqual([false, true, true]);
    });
  });

  describe('butacas', () => {
    it('no deja avanzar sin butacas elegidas', async () => {
      await crear();

      expect(botonCon('Siguiente')?.disabled).toBe(true);
    });

    it('suma el precio de la función por tipo de butaca', async () => {
      await crear();

      await elegirButacas('b1', 'b2');

      expect(texto()).toContain('2 butaca(s) — $10000');
    });

    it('al confirmar las butacas avanza a candy', async () => {
      await crear();
      await elegirButacas('b1');

      await tocar('Siguiente');

      expect(html().querySelector('app-seleccion-candy')).not.toBeNull();
    });

    it('se queda en butacas y avisa si la reserva falla', async () => {
      await crear();
      await elegirButacas('b1');
      entradaServicio['reservar'].mockResolvedValue({ error: 'Ya no está disponible' });

      await tocar('Siguiente');

      expect(errores.mostrar).toHaveBeenCalledWith('Ya no está disponible');
      expect(html().querySelector('app-seleccion-candy')).toBeNull();
    });
  });

  describe('candy y pago', () => {
    it('desde candy se puede pasar al pago', async () => {
      await crear();

      await irAPago();

      expect(html().querySelector('app-resumen-compra')).not.toBeNull();
    });

    it('en el pago se puede volver a candy y a butacas', async () => {
      await crear();
      await irAPago();

      await tocar('Atrás');

      expect(html().querySelector('app-seleccion-candy')).not.toBeNull();
    });

    it('las pestañas habilitan lo ya alcanzado', async () => {
      await crear();
      await irAPago();

      const pestanas = [...html().querySelectorAll<HTMLButtonElement>('.compra__tab')];

      expect(pestanas.map((p) => p.disabled)).toEqual([false, false, false]);
    });

    it('el total incluye butacas y candy', async () => {
      await crear();
      await elegirButacas('b1');
      await tocar('Siguiente');
      html().querySelector<HTMLButtonElement>('.candy-item button:last-of-type')?.click();
      await esperar();

      await tocar('Siguiente');

      expect(texto()).toContain('Total: $6500');
    });
  });

  describe('comprador sin sesión', () => {
    it('no puede confirmar hasta ingresar un mail válido', async () => {
      await crear();
      await irAPago();

      expect(botonCon('Confirmar pago')?.disabled).toBe(true);

      await escribirEmail('no-es-un-mail');
      expect(botonCon('Confirmar pago')?.disabled).toBe(true);

      await escribirEmail('anonimo@mail.com');
      expect(botonCon('Confirmar pago')?.disabled).toBe(false);
    });

    it('si la película tiene restricción exige la edad mínima', async () => {
      pelicula.restriccion_edad = 18;
      await crear();
      await irAPago();
      await escribirEmail('anonimo@mail.com');
      const edad = html().querySelector<HTMLInputElement>('input[type="number"]')!;

      edad.value = '15';
      edad.dispatchEvent(new Event('input'));
      await esperar();
      expect(botonCon('Confirmar pago')?.disabled).toBe(true);

      edad.value = '20';
      edad.dispatchEvent(new Event('input'));
      await esperar();
      expect(botonCon('Confirmar pago')?.disabled).toBe(false);
    });

    it('arma el pedido con lo elegido y lo manda a procesar', async () => {
      await crear();
      await irAPago('b1', 'b2');
      await escribirEmail('anonimo@mail.com');

      await tocar('Confirmar pago');

      expect(procesoCompra.completar).toHaveBeenCalledTimes(1);
      expect(pedidoEnviado()).toMatchObject({
        funcion: FUNCION,
        sala: 'Sala 1',
        email: 'anonimo@mail.com',
        total: 10000,
        descuentoCupon: 0,
        premio: null,
        credito: 0,
        usuarioId: null,
        edadDeclarada: null,
      });
      expect(pedidoEnviado().codigo).toMatch(/^[A-Z2-9]{8}$/);
      expect(pedidoEnviado().butacas.map((b: Butaca) => b.id)).toEqual(['b1', 'b2']);
    });

    it('si la compra sale bien muestra la confirmación', async () => {
      await crear();
      await irAPago();
      await escribirEmail('anonimo@mail.com');

      await tocar('Confirmar pago');

      expect(html().querySelector('app-confirmacion-compra')).not.toBeNull();
      expect(texto()).toContain('¡Compra confirmada!');
      expect(html().querySelector('app-pasos-compra')).toBeNull();
    });

    it('si el servidor rechaza la compra se queda en el pago', async () => {
      procesoCompra.completar.mockResolvedValue(null);
      await crear();
      await irAPago();
      await escribirEmail('anonimo@mail.com');

      await tocar('Confirmar pago');

      expect(html().querySelector('app-confirmacion-compra')).toBeNull();
      expect(html().querySelector('app-resumen-compra')).not.toBeNull();
      expect(botonCon('Confirmar pago')?.disabled).toBe(false);
    });

    it('muestra el indicador de carga mientras confirma', async () => {
      let terminar!: (valor: unknown) => void;
      procesoCompra.completar.mockReturnValue(new Promise((resolver) => (terminar = resolver)));
      await crear();
      await irAPago();
      await escribirEmail('anonimo@mail.com');

      await tocar('Confirmar pago');
      expect(html().querySelector('.overlay-cargando')).not.toBeNull();

      terminar(RESULTADO);
      await esperar();
      expect(html().querySelector('.overlay-cargando')).toBeNull();
    });

    it('no procesa dos veces si se toca confirmar de nuevo mientras espera', async () => {
      let terminar!: (valor: unknown) => void;
      procesoCompra.completar.mockReturnValue(new Promise((resolver) => (terminar = resolver)));
      await crear();
      await irAPago();
      await escribirEmail('anonimo@mail.com');

      await tocar('Confirmar pago');
      await tocar('Confirmar pago');
      terminar(RESULTADO);
      await esperar();

      expect(procesoCompra.completar).toHaveBeenCalledTimes(1);
    });
  });

  describe('cliente con sesión', () => {
    beforeEach(() => {
      iniciarSesionComoCliente();
    });

    it('compra con su mail y no se le pide uno', async () => {
      await crear();
      await irAPago();

      expect(texto()).toContain('Comprando como cliente@mail.com');
      expect(html().querySelector('input[type="email"]')).toBeNull();
    });

    it('aplica el cupón de bienvenida y lo manda en el pedido', async () => {
      await crear();
      await irAPago();

      await tocar('Confirmar pago');

      expect(pedidoEnviado()).toMatchObject({
        usuarioId: 'u1',
        email: 'cliente@mail.com',
        total: 4000,
        descuentoCupon: 800,
      });
    });

    it('usa el crédito disponible sobre lo que falta pagar', async () => {
      await crear();
      await irAPago();

      await tocar('Confirmar pago');

      expect(pedidoEnviado().credito).toBe(1000);
    });

    it('no aplica el cupón si ya lo usó', async () => {
      clienteServicio.obtenerOCrear.mockResolvedValue({
        data: { ...CLIENTE, cupon_bienvenida_usado: true },
        error: null,
      });
      await crear();
      await irAPago();

      await tocar('Confirmar pago');

      expect(pedidoEnviado().descuentoCupon).toBe(0);
    });

    it('permite elegir un premio y lo manda en el pedido', async () => {
      premios = [PREMIO];
      await crear();
      await irAPago();

      html().querySelector<HTMLButtonElement>('.premio-tile')?.click();
      await esperar();
      await tocar('Confirmar pago');

      expect(pedidoEnviado().premio).toMatchObject({ id: 'pr1', monto_descuento: 1500 });
    });

    it('al tocar de nuevo el premio elegido lo desmarca', async () => {
      premios = [PREMIO];
      await crear();
      await irAPago();

      html().querySelector<HTMLButtonElement>('.premio-tile')?.click();
      await esperar();
      html().querySelector<HTMLButtonElement>('.premio-tile')?.click();
      await esperar();
      await tocar('Confirmar pago');

      expect(pedidoEnviado().premio).toBeNull();
    });

    it('no ofrece premios que cuestan más puntos de los que tiene', async () => {
      premios = [{ ...PREMIO, costo_puntos: 5000 }];
      await crear();
      await irAPago();

      expect(html().querySelector('.premio-tile')).toBeNull();
    });

    it('recarga su perfil si el servidor rechaza la compra', async () => {
      procesoCompra.completar.mockResolvedValue(null);
      await crear();
      await irAPago();
      clienteServicio.obtenerOCrear.mockClear();

      await tocar('Confirmar pago');

      expect(clienteServicio.obtenerOCrear).toHaveBeenCalledWith('u1');
    });

    it('si su edad no alcanza para la película no puede confirmar', async () => {
      pelicula.restriccion_edad = 18;
      usuario.set({
        id: 'u1',
        email: 'cliente@mail.com',
        user_metadata: { role: 'cliente', fecha_nacimiento: '2015-01-01' },
      });
      await crear();
      await irAPago();

      expect(botonCon('Confirmar pago')?.disabled).toBe(true);
      expect(texto()).toContain('tu perfil no cumple esa edad');
    });
  });
});
