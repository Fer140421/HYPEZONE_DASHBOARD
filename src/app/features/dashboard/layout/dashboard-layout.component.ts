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
  template: `
    <mat-sidenav-container class="shell">
      <mat-sidenav
        #sidenav
        class="sidebar"
        [mode]="(isHandset$ | async) ? 'over' : 'side'"
        [opened]="(isHandset$ | async) === false"
      >
        <a class="brand" routerLink="/dashboard/resumen">
          <span class="brand-mark">HZ</span>
          <span>
            <strong>Hypezone</strong>
            <small>Streetwear admin</small>
          </span>
        </a>

        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="active-link"
              (click)="sidenav.mode === 'over' ? sidenav.close() : undefined"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar class="topbar">
          @if (isHandset$ | async) {
            <button mat-icon-button type="button" (click)="sidenav.toggle()" aria-label="Abrir menu">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="topbar-title">Panel de control</span>
          <span class="spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="accountMenu" aria-label="Cuenta">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #accountMenu="matMenu">
            <button mat-menu-item type="button" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar sesion</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
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
    { label: 'Categorías y marcas', icon: 'category', route: '/dashboard/catalogos' },
    { label: 'Configuracion', icon: 'settings', route: '/dashboard/configuracion' },
    { label: 'Limpiar productos', icon: 'cleaning_services', route: '/dashboard/limpieza-productos' },
  ];

  logout(): void {
    void this.authService.logout();
  }
}
