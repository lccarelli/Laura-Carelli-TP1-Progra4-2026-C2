import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { ReporteFacturacionDiaria } from '../../interfaces/reporte-facturacion-diaria';
import {
  ReportePeliculaVistaMes,
  ReportePeliculaVistaSemana,
} from '../../interfaces/reporte-pelicula-vista';
import { ReporteCandyVendido } from '../../interfaces/reporte-candy-vendido';

@Service()
export class ReporteServicio {
  private supabase = inject(Supabase);

  facturacionDiaria() {
    return this.supabase.Supabase.from('vista_facturacion_diaria')
      .select('*')
      .returns<ReporteFacturacionDiaria[]>();
  }

  peliculasMasVistasPorSemana() {
    return this.supabase.Supabase.from('vista_peliculas_mas_vistas_semana')
      .select('*')
      .returns<ReportePeliculaVistaSemana[]>();
  }

  peliculasMasVistasPorMes() {
    return this.supabase.Supabase.from('vista_peliculas_mas_vistas_mes')
      .select('*')
      .returns<ReportePeliculaVistaMes[]>();
  }

  candyMasVendido() {
    return this.supabase.Supabase.from('vista_candy_mas_vendido')
      .select('*')
      .returns<ReporteCandyVendido[]>();
  }
}
