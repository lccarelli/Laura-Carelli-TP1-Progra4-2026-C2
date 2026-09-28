import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Entrada } from '../../interfaces/entrada';
import { Butaca } from '../../interfaces/butaca';

export interface ButacaDeEntrada {
  butaca: Pick<Butaca, 'fila' | 'numero' | 'tipo'> | null;
}

const MINUTOS_RESERVA = 10;

function entradaVigente(entrada: Entrada): boolean {
  if (entrada.estado === 'vendida') {
    return true;
  }

  return !entrada.reservada_hasta || new Date(entrada.reservada_hasta) > new Date();
}

@Service()
export class EntradaServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'entrada';

  listarPorFuncion(funcionId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('funcion_id', funcionId)
      .in('estado', ['reservada', 'vendida'])
      .returns<Entrada[]>();
  }

  async reservar(funcionId: string, butacaIds: string[]) {
    const { data: entradas, error } = await this.listarPorFuncion(funcionId);

    if (error) {
      return { error: error.message };
    }

    const ocupadas = new Set(
      (entradas ?? []).filter(entradaVigente).map((entrada) => entrada.butaca_id),
    );
    const enConflicto = butacaIds.filter((id) => ocupadas.has(id));

    if (enConflicto.length > 0) {
      return { error: 'Alguna butaca elegida ya no está disponible. Volvé a elegir.' };
    }

    const reservadaHasta = new Date(Date.now() + MINUTOS_RESERVA * 60_000).toISOString();
    const { error: errorInsercion } = await this.supabase.Supabase.from(this.tabla).insert(
      butacaIds.map((butacaId) => ({
        funcion_id: funcionId,
        butaca_id: butacaId,
        estado: 'reservada' as const,
        reservada_hasta: reservadaHasta,
      })),
    );

    if (errorInsercion) {
      return { error: errorInsercion.message };
    }

    return { error: null };
  }

  async confirmarCompra(funcionId: string, butacaIds: string[], codigoCompra: string) {
    const { data: entradas, error } = await this.listarPorFuncion(funcionId);

    if (error) {
      return { error: error.message };
    }

    const propias = (entradas ?? []).filter(
      (entrada) => entrada.estado === 'reservada' && butacaIds.includes(entrada.butaca_id),
    );

    if (propias.length !== butacaIds.length) {
      return { error: 'La reserva venció. Volvé a elegir las butacas.' };
    }

    const { error: errorActualizacion } = await this.supabase.Supabase.from(this.tabla)
      .update({ estado: 'vendida', codigo_compra: codigoCompra, reservada_hasta: null })
      .eq('funcion_id', funcionId)
      .in(
        'butaca_id',
        propias.map((entrada) => entrada.butaca_id),
      );

    if (errorActualizacion) {
      return { error: errorActualizacion.message };
    }

    return { error: null };
  }

  listarPorCodigoCompra(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('butaca(fila, numero, tipo)')
      .eq('codigo_compra', codigoCompra)
      .returns<ButacaDeEntrada[]>();
  }

  suscribirCambios(funcionId: string, alCambiar: () => void) {
    return this.supabase.Supabase.channel(`entrada-funcion-${funcionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tabla,
          filter: `funcion_id=eq.${funcionId}`,
        },
        alCambiar,
      )
      .subscribe();
  }

  desuscribir(canal: ReturnType<EntradaServicio['suscribirCambios']>) {
    this.supabase.Supabase.removeChannel(canal);
  }
}
