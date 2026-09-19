import { Service, inject, WritableSignal, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { Supabase } from '../supabase/supabase';

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

  async cerrarSesion() {
    await this.supabase.Supabase.auth.signOut();
  }

  esAdmin(): boolean {
    return this.usuario()?.user_metadata?.['role'] === 'admin';
  }
}
