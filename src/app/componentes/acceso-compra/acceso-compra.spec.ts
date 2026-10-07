import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AccesoCompra } from './acceso-compra';

describe('AccesoCompra', () => {
  let fixture: ComponentFixture<AccesoCompra>;
  let emails: string[];
  let edades: (number | null)[];

  const html = () => fixture.nativeElement as HTMLElement;
  const texto = () => html().textContent?.replace(/\s+/g, ' ') ?? '';
  const campo = (tipo: string) => html().querySelector<HTMLInputElement>(`input[type="${tipo}"]`)!;
  const configurar = async (datos: Record<string, unknown> = {}) => {
    const valores = {
      esCliente: false,
      emailCliente: 'cliente@mail.com',
      restriccionEdad: null,
      edadClienteValida: true,
      emailAnonimo: '',
      edadAnonima: null,
      edadAnonimaValida: true,
      ...datos,
    };

    Object.entries(valores).forEach(([nombre, valor]) =>
      fixture.componentRef.setInput(nombre, valor),
    );
    await fixture.whenStable();
  };
  const escribir = (input: HTMLInputElement, valor: string) => {
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccesoCompra],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AccesoCompra);
    emails = [];
    edades = [];
    fixture.componentInstance.emailCambiado.subscribe((email) => emails.push(email));
    fixture.componentInstance.edadCambiada.subscribe((edad) => edades.push(edad));
  });

  describe('cliente con sesión', () => {
    it('muestra con qué mail compra y no pide datos', async () => {
      await configurar({ esCliente: true });

      expect(texto()).toContain('Comprando como cliente@mail.com');
      expect(html().querySelector('input')).toBeNull();
    });

    it('avisa si su edad no alcanza', async () => {
      await configurar({ esCliente: true, restriccionEdad: 18, edadClienteValida: false });

      expect(texto()).toContain('Esta película es para 18 años o más');
    });

    it('no avisa si su edad alcanza', async () => {
      await configurar({ esCliente: true, restriccionEdad: 18, edadClienteValida: true });

      expect(html().querySelector('.acceso-compra__error')).toBeNull();
    });
  });

  describe('comprador sin sesión', () => {
    it('pide el mail y emite lo que escribe', async () => {
      await configurar();

      escribir(campo('email'), 'anonimo@mail.com');

      expect(emails).toEqual(['anonimo@mail.com']);
    });

    it('muestra el mail ya ingresado', async () => {
      await configurar({ emailAnonimo: 'anonimo@mail.com' });

      expect(campo('email').value).toBe('anonimo@mail.com');
    });

    it('no pide la edad si la película no tiene restricción', async () => {
      await configurar({ restriccionEdad: null });

      expect(html().querySelector('input[type="number"]')).toBeNull();
    });

    it('pide la edad si la película tiene restricción', async () => {
      await configurar({ restriccionEdad: 16 });

      expect(texto()).toContain('Tu edad (esta película es +16)');
    });

    it('emite la edad como número', async () => {
      await configurar({ restriccionEdad: 16 });

      escribir(campo('number'), '17');

      expect(edades).toEqual([17]);
    });

    it('emite null si borra la edad', async () => {
      await configurar({ restriccionEdad: 16 });

      escribir(campo('number'), '');

      expect(edades).toEqual([null]);
    });

    it('avisa si la edad no alcanza', async () => {
      await configurar({ restriccionEdad: 16, edadAnonima: 12, edadAnonimaValida: false });

      expect(texto()).toContain('No alcanza la edad mínima para esta función.');
    });

    it('no avisa mientras no haya ingresado la edad', async () => {
      await configurar({ restriccionEdad: 16, edadAnonima: null, edadAnonimaValida: false });

      expect(html().querySelector('.acceso-compra__error')).toBeNull();
    });

    it('ofrece iniciar sesión volviendo a la pantalla actual, y registrarse', async () => {
      await configurar();

      const enlaces = [...html().querySelectorAll('a')];

      expect(enlaces.map((a) => a.textContent?.trim())).toEqual(['Iniciar sesión', 'Registrarme']);
      expect(enlaces[0].getAttribute('href')).toContain('/login?volver=');
      expect(enlaces[1].getAttribute('href')).toBe('/registro');
    });
  });
});
