import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <a class="sidebar-brand" [routerLink]="auth.user()?.role === 'TECHNICIAN' ? '/technician/reports' : '/reports'">
        Nexo
        <span class="sidebar-brand-badge">HelpDesk</span>
      </a>

      <nav class="sidebar-nav" aria-label="Navegación principal">
        @if (auth.user()?.role === 'TECHNICIAN') {
          <a routerLink="/technician/reports" routerLinkActive="active">Reportes</a>
        } @else {
          <a routerLink="/reports" routerLinkActive="active">Mis Reportes</a>
        }
      </nav>

      <div class="sidebar-user">
        <div class="sidebar-user-header">
          <strong>{{ auth.user()?.name }}</strong>
          <span
            class="role-badge"
            [class.technician]="auth.user()?.role === 'TECHNICIAN'"
            [class.user]="auth.user()?.role === 'USER'"
          >
            {{ auth.user()?.role === 'TECHNICIAN' ? 'Técnico' : 'Usuario' }}
          </span>
        </div>
        <div class="organization-label">
          Org: {{ auth.user()?.organizationSlug || 'UTMACH' }}
        </div>
        <button type="button" class="sidebar-logout" (click)="logout()">
          Cerrar sesión
        </button>
      </div>
    </aside>
  `
})
export class NavbarComponent {
  readonly auth = inject(AuthStateService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.clearSession();
    void this.router.navigate(['/login']);
  }
}
