import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { ConfiguracionCupon } from '../../interfaces/configuracion-cupon';

const ID_GLOBAL = 'global';

@Service()
export class ConfiguracionCuponServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'configuracion_cupon';

  obtener() {
    return this.supabase.obtenerPorId<ConfiguracionCupon>(this.tabla, ID_GLOBAL);
  }

  actualizar(porcentaje: number, edadMinima: number | null, descripcion: string | null) {
    return this.supabase.actualizar<ConfiguracionCupon>(this.tabla, ID_GLOBAL, {
      porcentaje,
      edad_minima: edadMinima,
      descripcion,
    });
  }
}
