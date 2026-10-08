import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { CompraPorConfirmar } from '../../interfaces/compra-por-confirmar';
import { Pelicula } from '../../interfaces/pelicula';

export interface CompraConDetalle {
  id: string;
  codigo_compra: string;
  total: number;
  creada_en: string;
  cancelada_en: string | null;
  funcion: {
    inicio: string;
    pelicula: { nombre: string } | null;
    sala: { nombre: string } | null;
  } | null;
}

export type CompraParaValidar = CompraConDetalle;

export type TipoUso = 'entrada' | 'candy';

export interface DatosEnvioQr {
  email: string;
  codigoCompra: string;
  qrBase64: string;
  posterUrl: string | null;
  peliculaNombre: string;
  restriccionTexto: string;
  sala: string;
  diaHora: string;
  formato: string;
  idioma: string;
  butacasTexto: string[];
  candyTexto: string[];
  combosTexto: string[];
  total: number;
  descuentoCupon: number;
}

export interface CompraConPelicula {
  id: string;
  cancelada_en: string | null;
  funcion: { inicio: string; pelicula: Pelicula | null } | null;
}

@Service()
export class CompraServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'compra';

  confirmar(compra: CompraPorConfirmar) {
    return this.supabase.Supabase.rpc('confirmar_compra', {
      codigo_param: compra.codigo,
      funcion_id_param: compra.funcionId,
      butaca_ids: compra.butacaIds,
      sesion_id_param: compra.sesionId,
      email_param: compra.email,
      edad_declarada_param: compra.edadDeclarada,
      total_param: compra.total,
      descuento_cupon_param: compra.descuentoCupon,
      premio_id_param: compra.premioId,
      credito_param: compra.credito,
      candy_param: compra.candy,
      combos_param: compra.combos,
    });
  }

  listarPeliculasVistasPorCliente(clienteId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select('id, cancelada_en, funcion(inicio, pelicula(*))')
      .eq('cliente_id', clienteId)
      .is('cancelada_en', null)
      .returns<CompraConPelicula[]>();
  }

  listarPorCliente(clienteId: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select(
        'id, codigo_compra, total, creada_en, cancelada_en, funcion(inicio, pelicula(nombre), sala(nombre))',
      )
      .eq('cliente_id', clienteId)
      .order('creada_en', { ascending: false })
      .returns<CompraConDetalle[]>();
  }

  async enviarQrPorMail(datos: DatosEnvioQr) {
    return this.supabase.Supabase.functions.invoke('resend-email', { body: datos });
  }

  async enviarPushCompraConfirmada(
    clienteId: string,
    peliculaNombre: string,
    codigoCompra: string,
  ) {
    return this.supabase.Supabase.functions.invoke('enviar-push-compra', {
      body: { clienteId, peliculaNombre, codigoCompra },
    });
  }

  async enviarPushDeUso(codigoCompra: string, tipo: TipoUso) {
    return this.supabase.Supabase.functions.invoke('enviar-push-uso', {
      body: { codigoCompra, tipo },
    });
  }

  buscarPorCodigo(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select(
        'id, codigo_compra, total, creada_en, cancelada_en, funcion(inicio, pelicula(nombre), sala(nombre))',
      )
      .eq('codigo_compra', codigoCompra)
      .maybeSingle<CompraParaValidar>();
  }
}
