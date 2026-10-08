import { inject, Service } from '@angular/core';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Supabase } from '../supabase/supabase';
import { Entrada } from '../../interfaces/entrada';
import { Butaca } from '../../interfaces/butaca';
import { entradaVigente } from '../../utilidades/entrada';

export interface ButacaDeEntrada {
  id: string;
  validada_en: string | null;
  butaca: Pick<Butaca, 'fila' | 'numero' | 'tipo'> | null;
}

export type CambioDeEntrada = RealtimePostgresChangesPayload<Entrada>;

const MINUTOS_RESERVA = 10;
const CLAVE_SESION = 'cine_sesion_compra';

@Service()
export class EntradaServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'entrada';

  sesionId(): string {
    let id = sessionStorage.getItem(CLAVE_SESION);

    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(CLAVE_SESION, id);
    }

    return id;
  }

  listarPorFuncion(funcionId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('funcion_id', funcionId)
      .in('estado', ['reservada', 'vendida'])
      .returns<Entrada[]>();
  }

  async reservar(funcionId: string, butacaIds: string[]) {
    const sesionId = this.sesionId();
    const { data: entradas, error } = await this.listarPorFuncion(funcionId);

    if (error) {
      return { error: error.message };
    }

    const vigentes = (entradas ?? []).filter(entradaVigente);
    const propias = vigentes.filter(
      (entrada) => entrada.estado === 'reservada' && entrada.sesion_id === sesionId,
    );
    const ocupadasPorOtros = new Set(
      vigentes.filter((entrada) => !propias.includes(entrada)).map((entrada) => entrada.butaca_id),
    );
    const enConflicto = butacaIds.filter((id) => ocupadasPorOtros.has(id));

    if (enConflicto.length > 0) {
      return { error: 'Alguna butaca elegida ya no está disponible. Volvé a elegir.' };
    }

    const aLiberar = propias.filter((entrada) => !butacaIds.includes(entrada.butaca_id));
    const aCrear = butacaIds.filter((id) => !propias.some((entrada) => entrada.butaca_id === id));

    if (aLiberar.length > 0) {
      const { error: errorBorrado } = await this.supabase.Supabase.from(this.tabla)
        .delete()
        .in(
          'id',
          aLiberar.map((entrada) => entrada.id),
        );

      if (errorBorrado) {
        return { error: errorBorrado.message };
      }
    }

    if (aCrear.length > 0) {
      // libera reservas vencidas de otras sesiones para esas butacas: si no se
      // borran, chocan con el índice único de abajo aunque ya no valgan.
      const { error: errorLimpieza } = await this.supabase.Supabase.from(this.tabla)
        .delete()
        .eq('funcion_id', funcionId)
        .eq('estado', 'reservada')
        .lt('reservada_hasta', new Date().toISOString())
        .in('butaca_id', aCrear);

      if (errorLimpieza) {
        return { error: errorLimpieza.message };
      }

      const reservadaHasta = new Date(Date.now() + MINUTOS_RESERVA * 60_000).toISOString();
      const { error: errorInsercion } = await this.supabase.Supabase.from(this.tabla).insert(
        aCrear.map((butacaId) => ({
          funcion_id: funcionId,
          butaca_id: butacaId,
          estado: 'reservada' as const,
          reservada_hasta: reservadaHasta,
          sesion_id: sesionId,
        })),
      );

      if (errorInsercion) {
        if (errorInsercion.code === '23505') {
          return { error: 'Alguien más reservó esa butaca justo antes que vos. Volvé a elegir.' };
        }

        return { error: errorInsercion.message };
      }
    }

    return { error: null };
  }

  listarPorCodigoCompra(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('id, validada_en, butaca(fila, numero, tipo)')
      .eq('codigo_compra', codigoCompra)
      .returns<ButacaDeEntrada[]>();
  }

  validar(codigoCompra: string, entradaIds: string[]) {
    return this.supabase.Supabase.rpc('validar_entradas', {
      codigo_compra_param: codigoCompra,
      entrada_ids: entradaIds,
    });
  }

  suscribirCambios(
    funcionId: string,
    alCambiar: (cambio: CambioDeEntrada) => void,
    alConectar: () => void,
  ) {
    return this.supabase.Supabase.channel(`entrada-funcion-${funcionId}`)
      .on<Entrada>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tabla,
          filter: `funcion_id=eq.${funcionId}`,
        },
        alCambiar,
      )
      .subscribe((estado) => {
        if (estado === 'SUBSCRIBED') {
          alConectar();
        }
      });
  }

  desuscribir(canal: ReturnType<EntradaServicio['suscribirCambios']>) {
    this.supabase.Supabase.removeChannel(canal);
  }
}
