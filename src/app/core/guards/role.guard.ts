import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { UserRole } from '../models/user-profile.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as UserRole[] | undefined;

  return auth.sessionState$.pipe(
    filter((state) => !['initializing', 'loading-profile'].includes(state.status)),
    take(1),
    map((state) =>
      state.status === 'authenticated' && roles?.includes(state.profile!.role)
        ? true
        : router.createUrlTree(['/auth/access'], { queryParams: { reason: 'forbidden' } }),
    ),
  );
};
