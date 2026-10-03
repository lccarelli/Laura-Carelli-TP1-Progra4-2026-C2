import { inject, Service } from '@angular/core';
import { Supabase } from '../supabase/supabase';
import { Premio } from '../../interfaces/premio';
import { PremioPorCrear } from '../../interfaces/premio-por-crear';

@Service()
export class PremioServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'premio';

  listarTodas() {
    return this.supabase.listar<Premio>(this.tabla);
  }

  listarActivas() {
    return this.supabase.Supabase.from(this.tabla)
      .select('*')
      .eq('activa', true)
      .order('costo_puntos')
      .returns<Premio[]>();
  }

  buscarPorId(id: string) {
    return this.supabase.obtenerPorId<Premio>(this.tabla, id);
  }

  crear(premio: PremioPorCrear) {
    return this.supabase.Supabase.from(this.tabla).insert(premio).select().single<Premio>();
  }

  editar({ id, ...datos }: PremioPorCrear & { id: string }) {
    return this.supabase.actualizar<Premio>(this.tabla, id, datos);
  }

  eliminar(id: string) {
    return this.supabase.eliminar(this.tabla, id);
  }

  avisarPorPush(premioId: string, premioNombre: string, costoPuntos: number) {
    return this.supabase.Supabase.functions.invoke('enviar-push-premio', {
      body: { premioId, premioNombre, costoPuntos },
    });
  }

  avisarPorMail(
    premioId: string,
    premioNombre: string,
    costoPuntos: number,
    montoDescuento: number | null,
  ) {
    return this.supabase.Supabase.functions.invoke('enviar-email-premio', {
      body: { premioId, premioNombre, costoPuntos, montoDescuento },
    });
  }
}
