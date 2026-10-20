import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, SessionResponse, User, UserRole } from '../models/user.model';

/** Página de inicio de cada rol. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  USER: '/reports',
  TECHNICIAN: '/technician/reports'
};

/**
 * Estado de la sesión. El token vive en una cookie HttpOnly que JavaScript no puede leer
 * (spec 003, FR-001); aquí solo se guarda el perfil público del usuario, en memoria.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly home = computed(() => HOME_BY_ROLE[this.user()?.role ?? 'USER']);

  /** Se ejecuta al iniciar la app: si la cookie sigue vigente, recupera el perfil. */
  restore(): Promise<void> {
    return firstValueFrom(
      this.http.get<SessionResponse>(`${this.baseUrl}/me`).pipe(
        tap(({ user }) => this.user.set(user)),
        map(() => undefined),
        catchError(() => of(undefined))
      )
    );
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<SessionResponse>(`${this.baseUrl}/login`, credentials).pipe(
      map(({ user }) => user),
      tap(user => this.user.set(user))
    );
  }

  logout(): void {
    this.http.post<void>(`${this.baseUrl}/logout`, null).pipe(catchError(() => of(null))).subscribe();
    this.expire();
  }

  /** Limpia el estado local y vuelve al login (p. ej. ante un 401). */
  expire(reason?: 'expired'): void {
    this.user.set(null);
    void this.router.navigate(['/login'], reason ? { queryParams: { reason } } : undefined);
  }
}
