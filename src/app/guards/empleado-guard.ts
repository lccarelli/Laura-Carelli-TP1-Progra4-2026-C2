import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Supabase } from '../servicios/supabase/supabase';

export const empleadoGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const supabase = inject(Supabase);

  const { data } = await supabase.Supabase.auth.getSession();
  const rol = data.session?.user.user_metadata['role'];
  const puedeValidar = rol === 'empleado' || rol === 'admin';

  return puedeValidar ? true : router.parseUrl('/login');
};
