import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Cliente } from '../../interfaces/cliente';
import { MovimientoCredito } from '../../interfaces/movimiento-credito';

@Service()
export class ClienteServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'cliente';

  async obtenerOCrear(id: string) {
    const { data, error } = await this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('id', id)
      .maybeSingle<Cliente>();

    if (error) {
      return { data: null, error };
    }

    if (data) {
      return { data, error: null };
    }

    return this.supabase.Supabase.from(this.tabla).insert({ id }).select('*').single<Cliente>();
  }

  usarCuponBienvenida() {
    return this.supabase.Supabase.rpc('usar_cupon_bienvenida');
  }

  sumarPuntosCompra(monto: number) {
    return this.supabase.Supabase.rpc('sumar_puntos_compra', { monto });
  }

  cancelarCompra(codigoCompra: string) {
    return this.supabase.Supabase.rpc('cancelar_compra', { codigo_compra_param: codigoCompra });
  }

  usarCredito(codigoCompra: string, monto: number) {
    return this.supabase.Supabase.rpc('usar_credito', {
      codigo_compra_param: codigoCompra,
      monto_param: monto,
    });
  }

  listarMovimientosCredito(clienteId: string) {
    return this.supabase.Supabase.from('movimiento_credito')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('creada_en', { ascending: false })
      .returns<MovimientoCredito[]>();
  }
}
