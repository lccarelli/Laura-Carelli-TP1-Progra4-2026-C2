import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Supabase } from '../servicios/supabase/supabase';

export const clienteGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = inject(Supabase);

  const { data } = await supabase.Supabase.auth.getSession();
  const esCliente = data.session?.user.user_metadata['role'] === 'cliente';

  return esCliente ? true : router.parseUrl('/login');
};
