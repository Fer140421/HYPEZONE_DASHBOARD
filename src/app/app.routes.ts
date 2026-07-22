import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/access',
    loadComponent: () =>
      import('./features/auth/access-state/access-state.component').then((m) => m.AccessStateComponent),
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
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin', 'seller'] },
        loadComponent: () =>
          import('./features/dashboard/resumen/resumen.component').then((m) => m.ResumenComponent),
      },
      {
        path: 'lotes',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'lotes/nuevo',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'lotes/:id/editar',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'lotes/:id',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/lotes/lotes.component').then((m) => m.LotesComponent),
      },
      {
        path: 'productos',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin', 'seller'] },
        loadComponent: () =>
          import('./features/dashboard/productos/productos.component').then(
            (m) => m.ProductosComponent,
          ),
      },
      {
        path: 'productos/nuevo',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/productos/productos.component').then(
            (m) => m.ProductosComponent,
          ),
      },
      {
        path: 'productos/:id',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/productos/productos.component').then(
            (m) => m.ProductosComponent,
          ),
      },
      {
        path: 'ventas',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin', 'seller'] },
        loadComponent: () =>
          import('./features/dashboard/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'proveedores',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/proveedores/proveedores.component').then(
            (m) => m.ProveedoresComponent,
          ),
      },
      {
        path: 'clientes',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin', 'seller'] },
        loadComponent: () =>
          import('./features/dashboard/clientes/clientes.component').then((m) => m.ClientesComponent),
      },
      {
        path: 'ventas/nueva',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin', 'seller'] },
        loadComponent: () =>
          import('./features/dashboard/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'ventas/:id/editar',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/ventas/ventas.component').then((m) => m.VentasComponent),
      },
      {
        path: 'configuracion',
        canActivate: [roleGuard],
        data: { roles: ['owner'] },
        loadComponent: () =>
          import('./features/dashboard/configuracion/configuracion.component').then(
            (m) => m.ConfiguracionComponent,
          ),
      },
      {
        path: 'catalogos',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/catalogos/catalogos.component').then((m) => m.CatalogosComponent),
      },
      {
        path: 'marcas',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/marcas/marcas.component').then((m) => m.MarcasComponent),
      },
      {
        path: 'tallas',
        canActivate: [roleGuard],
        data: { roles: ['owner', 'admin'] },
        loadComponent: () =>
          import('./features/dashboard/tallas/tallas.component').then((m) => m.TallasComponent),
      },
      {
        path: 'limpieza-productos',
        canActivate: [roleGuard],
        data: { roles: ['owner'] },
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
