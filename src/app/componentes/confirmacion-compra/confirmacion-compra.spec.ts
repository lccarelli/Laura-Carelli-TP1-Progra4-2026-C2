import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConfirmacionCompra } from './confirmacion-compra';

describe('ConfirmacionCompra', () => {
  let fixture: ComponentFixture<ConfirmacionCompra>;

  const html = () => fixture.nativeElement as HTMLElement;
  const texto = () => html().textContent?.replace(/\s+/g, ' ') ?? '';
  const mostrar = async (datos: Record<string, unknown> = {}) => {
    const valores = {
      restriccionEdad: null,
      qr: 'data:image/png;base64,AAA',
      codigo: 'ABCD2345',
      descuentoCupon: 0,
      credito: 0,
      mailEnviado: null,
      email: 'cliente@mail.com',
      ...datos,
    };

    Object.entries(valores).forEach(([nombre, valor]) =>
      fixture.componentRef.setInput(nombre, valor),
    );
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmacionCompra],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmacionCompra);
  });

  it('confirma la compra y muestra el código con formato', async () => {
    await mostrar();

    expect(texto()).toContain('¡Compra confirmada!');
    expect(texto()).toContain('Código: ABCD-2345');
    expect(texto()).toContain('Mostrá este código en boletería para retirar.');
  });

  it('muestra el QR cuando está listo', async () => {
    await mostrar();

    expect(html().querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAA');
  });

  it('no muestra imagen mientras el QR no se generó', async () => {
    await mostrar({ qr: null });

    expect(html().querySelector('img')).toBeNull();
  });

  it('informa el cupón y el crédito sólo si se usaron', async () => {
    await mostrar({ descuentoCupon: 1500, credito: 800 });

    expect(texto()).toContain('Se aplicó tu cupón de bienvenida: -$1500');
    expect(texto()).toContain('Usaste tu crédito: -$800');
  });

  it('no informa cupón ni crédito si no se usaron', async () => {
    await mostrar();

    expect(html().querySelector('.confirmacion__cupon')).toBeNull();
  });

  it('avisa a qué mail se envió el QR', async () => {
    await mostrar({ mailEnviado: true });

    expect(texto()).toContain('Te enviamos el QR a cliente@mail.com.');
  });

  it('avisa que el mail falló pero la compra sigue confirmada', async () => {
    await mostrar({ mailEnviado: false });

    expect(html().querySelector('.confirmacion__mail--error')?.textContent).toContain(
      'No pudimos enviarte el mail, pero tu compra quedó confirmada igual.',
    );
  });

  it('no dice nada del mail mientras no se sabe si salió', async () => {
    await mostrar({ mailEnviado: null });

    expect(html().querySelector('.confirmacion__mail')).toBeNull();
  });

  it('incluye el aviso de edad de la función', async () => {
    await mostrar({ restriccionEdad: 18 });

    expect(texto()).toContain('Esta función es +18');
  });

  it('ofrece volver a la cartelera', async () => {
    await mostrar();

    const enlace = html().querySelector('a');

    expect(enlace?.textContent?.trim()).toBe('Volver a la cartelera');
    expect(enlace?.getAttribute('href')).toBe('/peliculas');
  });

  it('imprime el comprobante al pedir descargarlo', async () => {
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    await mostrar();

    [...html().querySelectorAll('button')]
      .find((boton) => boton.textContent?.includes('Descargar comprobante'))
      ?.click();

    expect(imprimir).toHaveBeenCalledTimes(1);
    imprimir.mockRestore();
  });
});
