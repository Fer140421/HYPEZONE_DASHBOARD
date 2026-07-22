import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map, shareReplay } from 'rxjs';
import { AuthService, Permission } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  permission: Permission;
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
  readonly auth = inject(AuthService);
  readonly showEnvironmentBanner = environment.showEnvironmentBanner;
  readonly environmentName = environment.environmentName;

  readonly isHandset$ = this.breakpointObserver.observe('(max-width: 900px)').pipe(
    map((result) => result.matches),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly navItems: NavItem[] = [
    { label: 'Resumen', icon: 'dashboard', route: '/dashboard/resumen', permission: 'viewProducts' },
    { label: 'Lotes', icon: 'local_shipping', route: '/dashboard/lotes', permission: 'manageLots' },
    { label: 'Productos', icon: 'inventory_2', route: '/dashboard/productos', permission: 'viewProducts' },
    { label: 'Ventas', icon: 'point_of_sale', route: '/dashboard/ventas', permission: 'registerSales' },
    { label: 'Proveedores', icon: 'local_shipping', route: '/dashboard/proveedores', permission: 'manageSuppliers' },
    { label: 'Clientes', icon: 'groups', route: '/dashboard/clientes', permission: 'manageCustomers' },
    { label: 'Categorias', icon: 'category', route: '/dashboard/catalogos', permission: 'manageCatalogs' },
    { label: 'Marcas', icon: 'branding_watermark', route: '/dashboard/marcas', permission: 'manageCatalogs' },
    { label: 'Tallas', icon: 'straighten', route: '/dashboard/tallas', permission: 'manageCatalogs' },
    { label: 'Configuracion', icon: 'settings', route: '/dashboard/configuracion', permission: 'manageSettings' },
    { label: 'Limpiar productos', icon: 'cleaning_services', route: '/dashboard/limpieza-productos', permission: 'cleanupProducts' },
  ];
  readonly visibleNavItems = computed(() => this.navItems.filter((item) => this.auth.can(item.permission)));

  logout(): void {
    void this.auth.logout();
  }
}
