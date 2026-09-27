import { inject, Service } from '@angular/core';
import { PeliculaPorCrear } from '../../interfaces/pelicula-por-crear';
import { Supabase } from '../supabase/supabase';
import { Pelicula } from '../../interfaces/pelicula';

const TABLA_NO_ENCONTRADA = 'PGRST205';
const DIAS_VENTANA_MAS_VENDIDAS = 30;
const CANTIDAD_DESTACADAS = 3;

interface FilaEntradaConPelicula {
  funcion: { pelicula_id: string } | null;
}

@Service()
export class PeliculaServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'pelicula';

  listar() {
    return this.supabase.listar<Pelicula>(this.tabla);
  }

  listarDestacadasManual() {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('destacada', true)
      .eq('activa', true)
      .limit(CANTIDAD_DESTACADAS)
      .returns<Pelicula[]>();
  }

  async listarMasVendidasUltimoMes() {
    const desde = new Date();
    desde.setDate(desde.getDate() - DIAS_VENTANA_MAS_VENDIDAS);

    const { data: entradas, error } = await this.supabase.Supabase.from('entrada')
      .select('funcion(pelicula_id)')
      .eq('estado', 'vendida')
      .gte('creada_en', desde.toISOString())
      .returns<FilaEntradaConPelicula[]>();

    if (error) {
      return { data: error.code === TABLA_NO_ENCONTRADA ? [] : null, error };
    }

    const ventasPorPelicula = new Map<string, number>();

    for (const entrada of entradas ?? []) {
      const peliculaId = entrada.funcion?.pelicula_id;
      if (!peliculaId) continue;
      ventasPorPelicula.set(peliculaId, (ventasPorPelicula.get(peliculaId) ?? 0) + 1);
    }

    const idsMasVendidas = [...ventasPorPelicula.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, CANTIDAD_DESTACADAS)
      .map(([peliculaId]) => peliculaId);

    if (idsMasVendidas.length === 0) {
      return { data: [], error: null };
    }

    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .in('id', idsMasVendidas)
      .eq('activa', true)
      .returns<Pelicula[]>();
  }

  buscarPorId(id: string) {
    return this.supabase.obtenerPorId<Pelicula>(this.tabla, id);
  }

  crear(pelicula: PeliculaPorCrear) {
    return this.supabase.Supabase.from(this.tabla).insert(pelicula).select().returns<Pelicula[]>();
  }

  editar({ id, ...datos }: Pelicula) {
    return this.supabase.actualizar<Pelicula>(this.tabla, id, datos);
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }

  cambiarEstado(id: string, activa: boolean) {
    return this.supabase.actualizar<Pelicula>(this.tabla, id, { activa });
  }
}
