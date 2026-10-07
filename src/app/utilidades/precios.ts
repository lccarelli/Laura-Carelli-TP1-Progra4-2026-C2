import { Butaca } from '../interfaces/butaca';
import { Funcion } from '../interfaces/funcion';
import { PreciosButaca } from '../interfaces/precios-butaca';

type ButacaConTipo = Pick<Butaca, 'tipo'>;
type PreciosDeFuncion = Pick<Funcion, 'precio_normal' | 'precio_accesible' | 'precio_vip'>;

export const PRECIOS_POR_DEFECTO: PreciosButaca = {
  normal: 4000,
  accesible: 4000,
  vip: 6000,
};

export function preciosDeFuncion(funcion: PreciosDeFuncion): PreciosButaca {
  return {
    normal: funcion.precio_normal,
    accesible: funcion.precio_accesible,
    vip: funcion.precio_vip,
  };
}

function precioDeButaca(
  tipo: Butaca['tipo'],
  precios: PreciosButaca,
  porcentajeDescuento: number,
): number {
  const precioNormal = precios[tipo];

  return porcentajeDescuento > 0
    ? Math.round(precioNormal * (1 - porcentajeDescuento / 100))
    : precioNormal;
}

export function precioDeButacas(
  butacas: ButacaConTipo[],
  precios: PreciosButaca,
  porcentajeDescuento = 0,
): number {
  return butacas.reduce(
    (acumulado, butaca) => acumulado + precioDeButaca(butaca.tipo, precios, porcentajeDescuento),
    0,
  );
}

export function descuentoDePreventa(
  butacas: ButacaConTipo[],
  precios: PreciosButaca,
  porcentajeDescuento: number,
): number {
  return precioDeButacas(butacas, precios) - precioDeButacas(butacas, precios, porcentajeDescuento);
}

export function calcularDescuentoCupon(total: number, porcentaje: number): number {
  return Math.round((total * porcentaje) / 100);
}

export function calcularCredito(
  creditoDisponible: number,
  total: number,
  descuentos: number,
): number {
  return Math.max(0, Math.min(creditoDisponible, total - descuentos));
}

export function calcularTotalAPagar(total: number, descuentos: number, credito: number): number {
  return Math.max(0, total - descuentos - credito);
}
