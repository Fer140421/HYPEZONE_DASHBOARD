import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-access-state',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <main class="access-page">
      <mat-card>
        <mat-icon>lock</mat-icon>
        <h1>{{ title() }}</h1>
        <p>{{ message() }}</p>
        @if (reason() === 'forbidden') {
          <a mat-flat-button color="primary" routerLink="/dashboard">Volver al resumen</a>
        } @else {
          <button mat-flat-button color="primary" type="button" (click)="logout()">Cerrar sesión</button>
        }
      </mat-card>
    </main>
  `,
  styles: [
    `
      .access-page { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
      mat-card { max-width: 440px; padding: 32px; text-align: center; }
      mat-icon { font-size: 42px; width: 42px; height: 42px; }
      h1 { margin: 16px 0 8px; } p { margin: 0 0 24px; }
    `,
  ],
})
export class AccessStateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  readonly reason = computed(() => this.route.snapshot.queryParamMap.get('reason') ?? 'forbidden');
  readonly title = computed(() => (this.reason() === 'forbidden' ? 'Acceso no autorizado' : 'Acceso administrativo bloqueado'));
  readonly message = computed(() => {
    switch (this.reason()) {
      case 'missing-profile': return 'Tu cuenta no tiene un perfil administrativo configurado';
      case 'inactive': return 'Tu cuenta está desactivada';
      case 'profile-error': return 'No pudimos verificar tu perfil administrativo. Intenta nuevamente o contacta al administrador.';
      default: return 'No tienes permisos para acceder a esta sección.';
    }
  });

  logout(): void { void this.auth.logout(); }
}
