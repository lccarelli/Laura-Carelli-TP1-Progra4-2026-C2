import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Supabase } from '../servicios/supabase/supabase';

export const adminGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = inject(Supabase);

  const { data } = await supabase.Supabase.auth.getSession();
  const esAdmin = data.session?.user.user_metadata['role'] === 'admin';

  return esAdmin ? true : router.parseUrl('/login');
};
