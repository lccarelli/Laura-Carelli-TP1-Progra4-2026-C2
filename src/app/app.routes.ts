import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.Inicio),
  },
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
  {
    path: 'admin/salas',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/salas/salas').then((m) => m.Salas),
  },
  {
    path: 'admin/salas/nueva',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/salas/formulario/formulario').then((m) => m.FormularioSala),
  },
  {
    path: 'admin/funciones',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/funciones/funciones').then((m) => m.Funciones),
  },
  {
    path: 'admin/funciones/nueva',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/funciones/formulario/formulario').then((m) => m.FormularioFuncion),
  },
  {
    path: 'admin/funciones/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/funciones/detalle/detalle').then((m) => m.Detalle),
  },
];
