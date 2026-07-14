import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  template: `
    <main class="login-page">
      <div class="login-glow"></div>
      <mat-card class="login-card">
        <div class="login-brand">
          <p>Hypezone</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>mail</mat-icon>
            <input matInput type="email" formControlName="email" autocomplete="email" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input
              matInput
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              [attr.aria-label]="showPassword() ? 'Ocultar password' : 'Ver password'"
              (click)="showPassword.set(!showPassword())"
            >
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (error()) {
            <p class="form-error">{{ error() }}</p>
          }

          <button mat-flat-button class="primary-action" type="submit" [disabled]="form.invalid || loading()">
            {{ loading() ? 'Ingresando...' : 'Iniciar sesion' }}
          </button>
        </form>
      </mat-card>
    </main>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();
    this.authService.login(email, password).subscribe({
      next: () => void this.router.navigateByUrl('/dashboard'),
      error: () => {
        this.error.set('No pudimos iniciar sesion. Revisa tu email y contrasena.');
        this.loading.set(false);
      },
    });
  }
}
