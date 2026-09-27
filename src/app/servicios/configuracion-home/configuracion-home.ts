import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { ConfiguracionHome } from '../../interfaces/configuracion-home';

const ID_GLOBAL = 'global';

@Service()
export class ConfiguracionHomeServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'configuracion_home';

  obtener() {
    return this.supabase.obtenerPorId<ConfiguracionHome>(this.tabla, ID_GLOBAL);
  }

  actualizarModo(modo: ConfiguracionHome['modo_destacadas']) {
    return this.supabase.actualizar<ConfiguracionHome>(this.tabla, ID_GLOBAL, {
      modo_destacadas: modo,
    });
  }
}
