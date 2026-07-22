import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.sessionState$.pipe(
    filter((state) => state.status !== 'loading'),
    take(1),
    map((state) => (state.status === 'ready' ? router.createUrlTree(['/dashboard']) : true)),
  );
};
