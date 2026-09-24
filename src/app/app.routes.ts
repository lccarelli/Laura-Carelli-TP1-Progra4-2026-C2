import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/publico/peliculas/cartelera').then((m) => m.Cartelera),
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
  {
    path: 'admin/generos',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/generos/generos').then((m) => m.Generos),
  },
  {
    path: 'admin/generos/nueva',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/generos/formulario/formulario').then((m) => m.FormularioGenero),
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'peliculas',
    loadComponent: () => import('./pages/publico/peliculas/cartelera').then((m) => m.Cartelera),
  },
  {
    path: 'peliculas/:id',
    loadComponent: () => import('./pages/publico/peliculas/detalle').then((m) => m.Detalle),
  },
  {
    path: 'funciones/:id',
    loadComponent: () => import('./pages/publico/funciones/detalle').then((m) => m.Detalle),
  },
];
