import { inject, Service } from '@angular/core';
import { PeliculaPorCrear } from '../../interfaces/pelicula-por-crear';
import { Supabase } from '../supabase/supabase';
import { Pelicula } from '../../interfaces/pelicula';

@Service()
export class PeliculaServicio {
  private supabase = inject(Supabase);
  private readonly tabla = 'pelicula';

  listar() {
    return this.supabase.listar<Pelicula>(this.tabla);
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
