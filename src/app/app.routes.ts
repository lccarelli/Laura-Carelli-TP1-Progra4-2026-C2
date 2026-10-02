import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin-guard';
import { clienteGuard } from './guards/cliente-guard';
import { empleadoGuard } from './guards/empleado-guard';

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
    path: 'admin/funciones/pelicula/:peliculaId',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/funciones/pelicula/pelicula').then((m) => m.FuncionesPelicula),
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
    path: 'admin/configuracion',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/configuracion/configuracion').then((m) => m.Configuracion),
  },
  {
    path: 'admin/candy',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/candy/candy').then((m) => m.Candy),
  },
  {
    path: 'admin/candy/nueva',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/candy/formulario/formulario').then((m) => m.FormularioCandy),
  },
  {
    path: 'admin/candy/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/candy/formulario/formulario').then((m) => m.FormularioCandy),
  },
  {
    path: 'admin/combos',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/combos/combos').then((m) => m.Combos),
  },
  {
    path: 'admin/combos/nuevo',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/combos/formulario/formulario').then((m) => m.FormularioCombo),
  },
  {
    path: 'admin/combos/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/combos/formulario/formulario').then((m) => m.FormularioCombo),
  },
  {
    path: 'admin/premios',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/premios/premios').then((m) => m.Premios),
  },
  {
    path: 'admin/premios/nueva',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/premios/formulario/formulario').then((m) => m.FormularioPremio),
  },
  {
    path: 'admin/premios/:id/editar',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./pages/admin/premios/formulario/formulario').then((m) => m.FormularioPremio),
  },
  {
    path: 'admin/actividad',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/actividad/actividad').then((m) => m.Actividad),
  },
  {
    path: 'admin/reportes',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/reportes/reportes').then((m) => m.Reportes),
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
    path: 'proximamente',
    loadComponent: () =>
      import('./pages/publico/peliculas/proximamente').then((m) => m.Proximamente),
  },
  {
    path: 'funciones/:id',
    loadComponent: () => import('./pages/publico/funciones/detalle').then((m) => m.Detalle),
  },
  {
    path: 'mis-compras',
    canActivate: [clienteGuard],
    loadComponent: () =>
      import('./pages/publico/mis-compras/mis-compras').then((m) => m.MisCompras),
  },
  {
    path: 'mis-peliculas',
    canActivate: [clienteGuard],
    loadComponent: () =>
      import('./pages/publico/mis-peliculas/mis-peliculas').then((m) => m.MisPeliculas),
  },
  {
    path: 'boleteria',
    canActivate: [empleadoGuard],
    loadComponent: () => import('./pages/empleado/boleteria/boleteria').then((m) => m.Boleteria),
  },
  {
    path: 'mis-puntos',
    canActivate: [clienteGuard],
    loadComponent: () => import('./pages/publico/mis-puntos/mis-puntos').then((m) => m.MisPuntos),
  },
];
