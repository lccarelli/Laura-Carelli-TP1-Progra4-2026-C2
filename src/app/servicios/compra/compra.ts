import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { CompraPorCrear } from '../../interfaces/compra-por-crear';
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

  crear(compra: CompraPorCrear) {
    return this.supabase.crear(this.tabla, compra);
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

  buscarPorCodigo(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select(
        'id, codigo_compra, total, creada_en, cancelada_en, funcion(inicio, pelicula(nombre), sala(nombre))',
      )
      .eq('codigo_compra', codigoCompra)
      .maybeSingle<CompraParaValidar>();
  }
}
