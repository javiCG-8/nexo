import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { LoginResponse } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly state = inject(AuthStateService);

  login(credentials: { organizationSlug: string; email: string; password: string }) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => this.state.setSession(response.token, { ...response.user, organizationSlug: credentials.organizationSlug }))
    );
  }

  logout(): void {
    this.state.clearSession();
  }
}
