import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../models/user.model';
import { SessionService } from '../services/session.service';

/** Exige sesión; si no hay, envía al login recordando la ruta solicitada. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  return session.isAuthenticated()
    ? true
    : inject(Router).createUrlTree(['/login'], { queryParams: { next: state.url } });
};

/** Exige un rol; cualquier otro rol se redirige a SU página de inicio (evita bucles de redirección). */
export const roleGuard = (role: UserRole): CanActivateFn => () => {
  const session = inject(SessionService);
  return session.user()?.role === role ? true : inject(Router).parseUrl(session.home());
};

/** El login solo es accesible sin sesión. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  return session.isAuthenticated() ? inject(Router).parseUrl(session.home()) : true;
};

/** Ruta raíz: decide el destino según la sesión. */
export const homeRedirect = () => {
  const session = inject(SessionService);
  return session.isAuthenticated() ? session.home() : '/login';
};
