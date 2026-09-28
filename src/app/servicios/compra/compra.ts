import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { CompraPorCrear } from '../../interfaces/compra-por-crear';

export interface CompraConDetalle {
  id: string;
  codigo_compra: string;
  total: number;
  creada_en: string;
  funcion: {
    inicio: string;
    pelicula: { nombre: string } | null;
    sala: { nombre: string } | null;
  } | null;
}

export interface DatosEnvioQr {
  email: string;
  codigoCompra: string;
  qrBase64: string;
  butacasImagenBase64: string | null;
  posterUrl: string | null;
  peliculaNombre: string;
  restriccionTexto: string;
  sala: string;
  diaHora: string;
  formato: string;
  idioma: string;
  butacasTexto: string[];
  candyTexto: string[];
  total: number;
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
        'id, codigo_compra, total, creada_en, funcion(inicio, pelicula(nombre), sala(nombre))',
      )
      .eq('cliente_id', clienteId)
      .order('creada_en', { ascending: false })
      .returns<CompraConDetalle[]>();
  }

  async enviarQrPorMail(datos: DatosEnvioQr) {
    return this.supabase.Supabase.functions.invoke('resend-email', { body: datos });
  }
}
