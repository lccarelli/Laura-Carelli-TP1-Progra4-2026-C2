interface PremioConCondiciones {
  dias_validos: number[] | null;
  cantidad_entradas: number | null;
}

export interface ContextoCompra {
  diaSemana: number;
  cantidadButacas: number;
}

export function premioEsAplicable(premio: PremioConCondiciones, contexto: ContextoCompra): boolean {
  if (premio.dias_validos && premio.dias_validos.length > 0) {
    if (!premio.dias_validos.includes(contexto.diaSemana)) {
      return false;
    }
  }

  if (premio.cantidad_entradas !== null) {
    if (contexto.cantidadButacas !== premio.cantidad_entradas) {
      return false;
    }
  }

  return true;
}
