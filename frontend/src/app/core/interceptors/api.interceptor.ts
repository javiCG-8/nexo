import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../services/session.service';

/**
 * - Envía la cookie de sesión solo a nuestra API (`withCredentials`), nunca a terceros.
 * - Ante un 401 en una petición autenticada, la sesión expiró: se limpia y se vuelve al login.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const session = inject(SessionService);
  const isAuthCall = req.url.includes('/auth/login') || req.url.includes('/auth/me');

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthCall && session.isAuthenticated()) {
        session.expire('expired');
      }
      return throwError(() => error);
    })
  );
};
