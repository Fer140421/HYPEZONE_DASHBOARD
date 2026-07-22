import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, User, signInWithEmailAndPassword, signOut, user } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, catchError, concat, filter, firstValueFrom, map, of, shareReplay, switchMap, take } from 'rxjs';
import { UserProfile, UserRole } from '../models/user-profile.model';
import { UserRepository } from '../repositories/user.repository';

export type Permission =
  | 'manageUsers'
  | 'manageProducts'
  | 'viewProducts'
  | 'registerSales'
  | 'manageSales'
  | 'manageLots'
  | 'manageSuppliers'
  | 'manageCustomers'
  | 'manageCatalogs'
  | 'viewReports'
  | 'manageSettings'
  | 'cleanupProducts'
  | 'viewCosts';

export type SessionStatus =
  | 'initializing'
  | 'unauthenticated'
  | 'loading-profile'
  | 'authenticated'
  | 'missing-profile'
  | 'inactive'
  | 'error';

export interface SessionState {
  status: SessionStatus;
  user: User | null;
  profile: UserProfile | null;
  error?: unknown;
}

const PERMISSIONS: Record<Permission, readonly UserRole[]> = {
  manageUsers: ['owner'],
  manageProducts: ['owner', 'admin'],
  viewProducts: ['owner', 'admin', 'seller'],
  registerSales: ['owner', 'admin', 'seller'],
  manageSales: ['owner', 'admin'],
  manageLots: ['owner', 'admin'],
  manageSuppliers: ['owner', 'admin'],
  manageCustomers: ['owner', 'admin', 'seller'],
  manageCatalogs: ['owner', 'admin'],
  viewReports: ['owner', 'admin'],
  manageSettings: ['owner'],
  cleanupProducts: ['owner'],
  viewCosts: ['owner', 'admin'],
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly users = inject(UserRepository);

  /** A single shared Auth/Profile listener. Custom claims can replace the profile role internally later. */
  readonly sessionState$: Observable<SessionState> = user(this.auth).pipe(
    switchMap((firebaseUser) => {
      if (!firebaseUser) {
        return of({ status: 'unauthenticated', user: null, profile: null } satisfies SessionState);
      }

      return concat(of({ status: 'loading-profile', user: firebaseUser, profile: null } satisfies SessionState), this.users.getProfile(firebaseUser.uid).pipe(
        map((profile) => {
          if (!profile) {
            return { status: 'missing-profile', user: firebaseUser, profile: null } satisfies SessionState;
          }
          return {
            status: profile.active ? 'authenticated' : 'inactive',
            user: firebaseUser,
            profile,
          } satisfies SessionState;
        }),
        catchError((error: unknown) =>
          of({ status: 'error', user: firebaseUser, profile: null, error } satisfies SessionState),
        ),
      ));
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  readonly sessionState = toSignal(this.sessionState$, {
    initialValue: { status: 'initializing', user: null, profile: null } as SessionState,
  });
  readonly firebaseUser = computed(() => this.sessionState().user);
  readonly profile = computed(() => this.sessionState().profile);
  readonly loading = computed(() => ['initializing', 'loading-profile'].includes(this.sessionState().status));
  readonly authenticated = computed(() => this.sessionState().status === 'authenticated');
  readonly active = this.authenticated;
  readonly role = computed<UserRole | null>(() => this.profile()?.role ?? null);
  readonly isOwner = computed(() => this.role() === 'owner');
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isSeller = computed(() => this.role() === 'seller');

  async login(email: string, password: string): Promise<SessionState> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    return this.waitForResolvedProfile(credential.user.uid);
  }

  can(permission: Permission): boolean {
    const role = this.role();
    return this.active() && role !== null && PERMISSIONS[permission].includes(role);
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      await firstValueFrom(this.sessionState$.pipe(
        filter((state) => state.status === 'unauthenticated'),
        take(1),
      ));
    } finally {
      await this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    }
  }

  private waitForResolvedProfile(uid: string): Promise<SessionState> {
    return firstValueFrom(this.sessionState$.pipe(
      filter((state) => state.user?.uid === uid && !['initializing', 'loading-profile'].includes(state.status)),
      take(1),
    ));
  }
}
