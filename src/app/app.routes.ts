import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'resumen' },
      {
        path: 'resumen',
        loadComponent: () =>
          import('./features/dashboard/resumen/resumen.component').then((m) => m.ResumenComponent),
      },
      {
        path: 'lotes',
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'lotes/nuevo',
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'lotes/:id/editar',
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'lotes/:id',
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/dashboard/productos/productos.component').then(
            (m) => m.ProductosComponent,
          ),
      },
      {
        path: 'productos/nuevo',
        loadComponent: () =>
          import('./features/dashboard/productos/productos.component').then(
            (m) => m.ProductosComponent,
          ),
      },
      {
        path: 'productos/:id',
        loadComponent: () =>
          import('./features/dashboard/productos/productos.component').then(
            (m) => m.ProductosComponent,
          ),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./features/dashboard/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'ventas/nueva',
        loadComponent: () =>
          import('./features/dashboard/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'ventas/:id/editar',
        loadComponent: () =>
          import('./features/dashboard/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/dashboard/configuracion/configuracion.component').then(
            (m) => m.ConfiguracionComponent,
          ),
      },
      {
        path: 'catalogos',
        loadComponent: () =>
          import('./features/dashboard/catalogos/catalogos.component').then((m) => m.CatalogosComponent),
      },
      {
        path: 'limpieza-productos',
        loadComponent: () =>
          import('./features/dashboard/limpieza-productos/limpieza-productos.component').then(
            (m) => m.LimpiezaProductosComponent,
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' },
];
