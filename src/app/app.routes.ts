import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
  },
  {
    path: 'admin/peliculas',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/peliculas/peliculas').then((m) => m.Peliculas),
  },
  {
    path: 'admin/peliculas/nueva',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/peliculas/formulario/formulario').then((m) => m.Formulario),
  },
  {
    path: 'admin/peliculas/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/peliculas/formulario/formulario').then((m) => m.Formulario),
  },
];
