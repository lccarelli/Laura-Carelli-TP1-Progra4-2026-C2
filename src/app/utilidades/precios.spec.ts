import {
  PRECIOS_POR_DEFECTO,
  calcularCredito,
  calcularDescuentoCupon,
  calcularTotalAPagar,
  descuentoDePreventa,
  precioDeButacas,
  preciosDeFuncion,
} from './precios';

const PRECIOS = { normal: 4000, accesible: 4000, vip: 6000 };

describe('precios', () => {
  describe('PRECIOS_POR_DEFECTO', () => {
    it('tiene un valor para cada tipo de butaca', () => {
      expect(PRECIOS_POR_DEFECTO).toEqual({ normal: 4000, accesible: 4000, vip: 6000 });
    });
  });

  describe('preciosDeFuncion', () => {
    it('toma los precios guardados en la función', () => {
      expect(
        preciosDeFuncion({ precio_normal: 5000, precio_accesible: 3500, precio_vip: 9000 }),
      ).toEqual({ normal: 5000, accesible: 3500, vip: 9000 });
    });
  });

  describe('precioDeButacas', () => {
    it('suma el precio de cada tipo de butaca', () => {
      expect(
        precioDeButacas([{ tipo: 'normal' }, { tipo: 'accesible' }, { tipo: 'vip' }], PRECIOS),
      ).toBe(14000);
    });

    it('usa los precios que se le pasan, no unos fijos', () => {
      const precios = { normal: 5000, accesible: 3500, vip: 9000 };

      expect(
        precioDeButacas([{ tipo: 'normal' }, { tipo: 'accesible' }, { tipo: 'vip' }], precios),
      ).toBe(17500);
    });

    it('devuelve 0 sin butacas', () => {
      expect(precioDeButacas([], PRECIOS)).toBe(0);
    });

    it('aplica el porcentaje a cada butaca y redondea', () => {
      expect(precioDeButacas([{ tipo: 'normal' }, { tipo: 'vip' }], PRECIOS, 25)).toBe(3000 + 4500);
      expect(precioDeButacas([{ tipo: 'normal' }], PRECIOS, 33)).toBe(2680);
    });

    it('ignora un porcentaje de 0', () => {
      expect(precioDeButacas([{ tipo: 'vip' }], PRECIOS, 0)).toBe(6000);
    });
  });

  describe('descuentoDePreventa', () => {
    it('es la diferencia entre el precio normal y el de preventa', () => {
      expect(descuentoDePreventa([{ tipo: 'normal' }, { tipo: 'vip' }], PRECIOS, 25)).toBe(2500);
    });

    it('depende de los precios de la función', () => {
      const precios = { normal: 8000, accesible: 8000, vip: 10000 };

      expect(descuentoDePreventa([{ tipo: 'normal' }, { tipo: 'vip' }], precios, 50)).toBe(9000);
    });

    it('es 0 sin descuento', () => {
      expect(descuentoDePreventa([{ tipo: 'normal' }], PRECIOS, 0)).toBe(0);
    });
  });

  describe('calcularDescuentoCupon', () => {
    it('calcula el porcentaje del total y redondea', () => {
      expect(calcularDescuentoCupon(10000, 15)).toBe(1500);
      expect(calcularDescuentoCupon(3333, 10)).toBe(333);
    });
  });

  describe('calcularCredito', () => {
    it('usa todo el crédito si el total lo cubre', () => {
      expect(calcularCredito(1000, 8000, 1500)).toBe(1000);
    });

    it('no usa más que lo que falta pagar', () => {
      expect(calcularCredito(5000, 3000, 1000)).toBe(2000);
    });

    it('es 0 sin crédito', () => {
      expect(calcularCredito(0, 8000, 0)).toBe(0);
    });

    it('nunca es negativo si los descuentos superan el total', () => {
      expect(calcularCredito(5000, 4000, 6000)).toBe(0);
    });
  });

  describe('calcularTotalAPagar', () => {
    it('resta descuentos y crédito', () => {
      expect(calcularTotalAPagar(10000, 1500, 1000)).toBe(7500);
    });

    it('nunca es negativo si los descuentos superan el total', () => {
      expect(calcularTotalAPagar(4000, 6000, 0)).toBe(0);
    });
  });
});
