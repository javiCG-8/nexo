import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';
import { AuthStateService } from '../services/auth-state.service';

export const roleGuard = (role: UserRole): CanActivateFn => () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  return auth.user()?.role === role ? true : router.createUrlTree(['/']);
};
