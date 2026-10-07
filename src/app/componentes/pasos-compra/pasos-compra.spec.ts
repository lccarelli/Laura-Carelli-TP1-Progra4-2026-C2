import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasoCompra } from '../../utilidades/pasos-compra';
import { PasosCompra } from './pasos-compra';

describe('PasosCompra', () => {
  let fixture: ComponentFixture<PasosCompra>;
  let elegidos: PasoCompra[];

  const pestanas = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
  const mostrar = async (paso: PasoCompra, pasoMaximo: PasoCompra) => {
    fixture.componentRef.setInput('paso', paso);
    fixture.componentRef.setInput('pasoMaximo', pasoMaximo);
    await fixture.whenStable();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PasosCompra] }).compileComponents();
    fixture = TestBed.createComponent(PasosCompra);
    elegidos = [];
    fixture.componentInstance.elegir.subscribe((paso) => elegidos.push(paso));
  });

  it('muestra las tres pestañas en orden', async () => {
    await mostrar('butacas', 'butacas');

    expect(pestanas().map((p) => p.textContent?.trim())).toEqual([
      '1 · Butacas',
      '2 · Candy',
      '3 · Pagar',
    ]);
  });

  it('marca como activa sólo la pestaña del paso actual', async () => {
    await mostrar('candy', 'pago');

    const activas = pestanas().map((p) => p.classList.contains('compra__tab--activo'));

    expect(activas).toEqual([false, true, false]);
  });

  it('al empezar sólo está disponible la primera pestaña', async () => {
    await mostrar('butacas', 'butacas');

    expect(pestanas().map((p) => p.disabled)).toEqual([false, true, true]);
  });

  it('habilita los pasos hasta el máximo alcanzado', async () => {
    await mostrar('butacas', 'candy');

    expect(pestanas().map((p) => p.disabled)).toEqual([false, false, true]);
  });

  it('con el pago alcanzado se puede volver a cualquier paso', async () => {
    await mostrar('pago', 'pago');

    expect(pestanas().map((p) => p.disabled)).toEqual([false, false, false]);
  });

  it('emite el paso de la pestaña que se toca', async () => {
    await mostrar('pago', 'pago');

    pestanas()[1].click();

    expect(elegidos).toEqual(['candy']);
  });

  it('no emite al tocar una pestaña deshabilitada', async () => {
    await mostrar('butacas', 'butacas');

    pestanas()[2].click();

    expect(elegidos).toEqual([]);
  });
});
