import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { CompraPorCrear } from '../../interfaces/compra-por-crear';

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

export interface CompraParaValidar extends CompraConDetalle {
  validada_en: string | null;
  validada_por: string | null;
}

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

@Service()
export class CompraServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'compra';

  crear(compra: CompraPorCrear) {
    return this.supabase.crear(this.tabla, compra);
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

  buscarPorCodigo(codigoCompra: string) {
    return this.supabase.Supabase.from(this.tabla)
      .select(
        'id, codigo_compra, total, creada_en, validada_en, validada_por, funcion(inicio, pelicula(nombre), sala(nombre))',
      )
      .eq('codigo_compra', codigoCompra)
      .maybeSingle<CompraParaValidar>();
  }

  async validar(codigoCompra: string, empleadoId: string) {
    const { data, error } = await this.supabase.Supabase.from(this.tabla)
      .update({ validada_en: new Date().toISOString(), validada_por: empleadoId })
      .eq('codigo_compra', codigoCompra)
      .is('validada_en', null)
      .select('id');

    if (error) {
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return { error: 'Este código ya fue utilizado o no existe.' };
    }

    return { error: null };
  }
}
