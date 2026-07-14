import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut,
  user,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly session = signal<User | null | undefined>(undefined);

  readonly user$: Observable<User | null> = user(this.auth);
  readonly currentUser = computed(() => this.session());
  readonly isAuthenticated = computed(() => Boolean(this.session()));
  readonly isLoadingSession = computed(() => this.session() === undefined);

  constructor() {
    this.user$.subscribe((currentUser) => this.session.set(currentUser));
  }

  login(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigateByUrl('/auth/login');
  }
}
