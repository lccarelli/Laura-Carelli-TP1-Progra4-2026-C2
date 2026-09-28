import { Service, inject, WritableSignal, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from '../supabase/supabase';
import { ClientePorCrear } from '../../interfaces/cliente-por-crear';

@Service()
export class Auth {
  private supabase = inject(Supabase);

  public usuario: WritableSignal<User | null> = signal(null);

  constructor() {
    this.supabase.Supabase.auth.onAuthStateChange((_event, session) => {
      this.usuario.set(session?.user ?? null);
    });
  }

  async loguear(email: string, password: string) {
    return await this.supabase.Supabase.auth.signInWithPassword({ email, password });
  }

  async registrarCliente(datos: ClientePorCrear) {
    const { email, password, ...perfil } = datos;

    return await this.supabase.Supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'cliente', ...perfil } },
    });
  }

  async cerrarSesion() {
    await this.supabase.Supabase.auth.signOut();
  }

  esAdmin(): boolean {
    return this.usuario()?.user_metadata?.['role'] === 'admin';
  }

  esCliente(): boolean {
    return this.usuario()?.user_metadata?.['role'] === 'cliente';
  }

  esEmpleado(): boolean {
    return this.usuario()?.user_metadata?.['role'] === 'empleado';
  }
}
