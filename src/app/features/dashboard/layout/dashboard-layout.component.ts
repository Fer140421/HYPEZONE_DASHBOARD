import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map, shareReplay } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.css',
})
export class DashboardLayoutComponent {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);

  readonly isHandset$ = this.breakpointObserver.observe('(max-width: 900px)').pipe(
    map((result) => result.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly navItems: NavItem[] = [
    { label: 'Resumen', icon: 'dashboard', route: '/dashboard/resumen' },
    { label: 'Lotes', icon: 'local_shipping', route: '/dashboard/lotes' },
    { label: 'Productos', icon: 'inventory_2', route: '/dashboard/productos' },
    { label: 'Ventas', icon: 'point_of_sale', route: '/dashboard/ventas' },
    { label: 'Proveedores', icon: 'local_shipping', route: '/dashboard/proveedores' },
    { label: 'Clientes', icon: 'groups', route: '/dashboard/clientes' },
    { label: 'Categorias', icon: 'category', route: '/dashboard/catalogos' },
    { label: 'Marcas', icon: 'branding_watermark', route: '/dashboard/marcas' },
    { label: 'Tallas', icon: 'straighten', route: '/dashboard/tallas' },
    { label: 'Configuracion', icon: 'settings', route: '/dashboard/configuracion' },
    { label: 'Limpiar productos', icon: 'cleaning_services', route: '/dashboard/limpieza-productos' },
  ];

  logout(): void {
    void this.authService.logout();
  }
}
