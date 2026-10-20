import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { environment } from '../../environments/environment';
import { SessionService } from '../core/services/session.service';
import { ThemePreference, ThemeService } from '../core/services/theme.service';
import { displayName } from '../core/utils/report-rules';
import { BrandComponent } from '../shared/ui/brand.component';
import { FeedbackService } from '../shared/ui/feedback.service';
import { IconComponent, IconName } from '../shared/ui/icon.component';
import { AvatarComponent } from '../shared/ui/report-badges.component';
import { SheetComponent } from '../shared/ui/sheet.component';

interface NavItem {
  label: string;
  icon: IconName;
  link: string;
  queryParams?: Record<string, string>;
  primary?: boolean;
}

const THEME_META: Record<ThemePreference, { label: string; icon: IconName }> = {
  system: { label: 'Tema del sistema', icon: 'monitor' },
  light: { label: 'Tema claro', icon: 'sun' },
  dark: { label: 'Tema oscuro', icon: 'moon' }
};

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandComponent, IconComponent, AvatarComponent, SheetComponent],
  template: `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>

    <!-- Escritorio: barra lateral -->
    <aside class="sidebar" aria-label="Barra lateral">
      <a class="sidebar-brand" [routerLink]="session.home()"><app-brand /></a>

      <nav class="sidebar-nav" aria-label="Principal">
        <p class="nav-caption">{{ isTechnician() ? 'Soporte' : 'Mi espacio' }}</p>
        @for (item of nav(); track item.label) {
          @if (!item.primary) {
            <a [routerLink]="item.link" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }" class="nav-link">
              <app-icon [name]="item.icon" />
              {{ item.label }}
            </a>
          }
        }
      </nav>

      @if (demoMode) {
        <p class="demo-note"><app-icon name="info" [size]="14" /> Demo con datos simulados</p>
      }

      <div class="sidebar-footer">
        <button type="button" class="nav-link" (click)="theme.cycle()">
          <app-icon [name]="themeMeta().icon" />
          {{ themeMeta().label }}
        </button>
        <div class="user-card">
          <app-avatar [name]="session.user()?.name" />
          <div class="user-meta">
            <strong>{{ firstName() }}</strong>
            <span>{{ roleLabel() }} · {{ session.user()?.organizationSlug }}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" (click)="logout()" aria-label="Cerrar sesión" title="Cerrar sesión">
            <app-icon name="logout" [size]="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Móvil: barra superior -->
    <header class="topbar">
      <a [routerLink]="session.home()" aria-label="Inicio"><app-brand [size]="28" /></a>
      <button type="button" class="avatar-button" (click)="accountOpen.set(true)" aria-label="Abrir mi cuenta">
        <app-avatar [name]="session.user()?.name" />
      </button>
    </header>

    <main id="contenido" class="content" tabindex="-1">
      <router-outlet />
    </main>

    <!-- Móvil: barra de pestañas -->
    <nav class="tabbar" aria-label="Principal">
      @for (item of nav(); track item.label) {
        <a
          [routerLink]="item.link"
          [queryParams]="item.queryParams"
          [routerLinkActive]="item.primary ? '' : 'active'"
          [routerLinkActiveOptions]="{ exact: false }"
          [class.tab-primary]="item.primary"
          class="tab"
        >
          <span class="tab-icon"><app-icon [name]="item.icon" [size]="item.primary ? 22 : 20" /></span>
          <span class="tab-label">{{ item.label }}</span>
        </a>
      }
      <button type="button" class="tab" (click)="accountOpen.set(true)">
        <span class="tab-icon"><app-icon name="user" [size]="20" /></span>
        <span class="tab-label">Cuenta</span>
      </button>
    </nav>

    <app-sheet [open]="accountOpen()" heading="Mi cuenta" (closed)="accountOpen.set(false)">
      <div class="account">
        <app-avatar [name]="session.user()?.name" style="--avatar-size: 48px" />
        <div>
          <strong>{{ session.user()?.name }}</strong>
          <p class="muted">{{ session.user()?.email }}</p>
          <p class="muted">{{ roleLabel() }} · {{ session.user()?.organizationSlug }}</p>
        </div>
      </div>
      <div class="account-actions">
        <button type="button" class="btn btn-block btn-lg" (click)="theme.cycle()">
          <app-icon [name]="themeMeta().icon" /> {{ themeMeta().label }}
        </button>
        <button type="button" class="btn btn-danger btn-block btn-lg" (click)="logout()">
          <app-icon name="logout" /> Cerrar sesión
        </button>
      </div>
    </app-sheet>

  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
    }
    .content {
      padding: calc(var(--topbar-h) + 16px) 16px calc(var(--tabbar-h) + 24px + env(safe-area-inset-bottom));
      outline: none;
    }

    /* ----- Móvil ----- */
    .sidebar { display: none; }
    .topbar {
      position: fixed;
      inset: 0 0 auto;
      z-index: 50;
      height: var(--topbar-h);
      padding: 0 12px 0 16px;
      padding-top: env(safe-area-inset-top);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: color-mix(in srgb, var(--bg) 82%, transparent);
      backdrop-filter: saturate(1.6) blur(14px);
      border-bottom: 1px solid var(--border);
    }
    .topbar a { text-decoration: none; }
    .avatar-button {
      display: grid;
      place-items: center;
      width: var(--tap);
      height: var(--tap);
      border-radius: 50%;
    }
    .tabbar {
      position: fixed;
      inset: auto 0 0;
      z-index: 50;
      display: flex;
      height: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      backdrop-filter: saturate(1.6) blur(14px);
      border-top: 1px solid var(--border);
    }
    .tab {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      color: var(--text-3);
      font-size: 11px;
      font-weight: 600;
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
    }
    .tab.active { color: var(--accent-text); }
    .tab-primary .tab-icon {
      display: grid;
      place-items: center;
      width: 46px;
      height: 32px;
      border-radius: var(--r-full);
      background: var(--accent);
      color: var(--on-accent);
    }
    .account {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 8px 0 20px;
    }
    .account p { font-size: 13px; }
    .account-actions {
      display: grid;
      gap: 10px;
    }

    /* ----- Escritorio ----- */
    @media (min-width: 1024px) {
      .topbar, .tabbar { display: none; }
      .content {
        margin-left: var(--sidebar-w);
        padding: 32px 40px 48px;
        max-width: calc(1240px + var(--sidebar-w));
      }
      .sidebar {
        position: fixed;
        inset: 0 auto 0 0;
        width: var(--sidebar-w);
        display: flex;
        flex-direction: column;
        padding: 18px 14px 14px;
        background: var(--surface);
        border-right: 1px solid var(--border);
      }
      .sidebar-brand {
        padding: 4px 8px 22px;
        text-decoration: none;
      }
      .nav-caption {
        padding: 0 10px 6px;
        font-size: 11.5px;
        font-weight: 600;
        color: var(--text-3);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .sidebar-nav {
        display: grid;
        gap: 2px;
      }
      .nav-link {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        min-height: 38px;
        padding: 0 10px;
        border-radius: var(--r-sm);
        color: var(--text-2);
        font-size: 14px;
        font-weight: 550;
        text-decoration: none;
        text-align: left;
        transition: background var(--dur) var(--ease), color var(--dur) var(--ease);
      }
      .nav-link:hover { background: var(--surface-2); color: var(--text); }
      .nav-link.active { background: var(--accent-soft); color: var(--accent-text); }
      .demo-note {
        display: flex;
        gap: 6px;
        align-items: center;
        margin: 16px 10px 0;
        font-size: 12px;
        color: var(--text-3);
      }
      .sidebar-footer {
        margin-top: auto;
        display: grid;
        gap: 8px;
      }
      .user-card {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: var(--r-md);
        background: var(--surface-2);
      }
      .user-meta {
        flex: 1;
        min-width: 0;
        display: grid;
        line-height: 1.3;
      }
      .user-meta strong {
        font-size: 13.5px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .user-meta span {
        font-size: 12px;
        color: var(--text-3);
      }
    }
  `
})
export class ShellComponent {
  protected readonly session = inject(SessionService);
  protected readonly theme = inject(ThemeService);
  private readonly feedback = inject(FeedbackService);
  protected readonly demoMode = environment.demoMode;
  protected readonly accountOpen = signal(false);

  protected readonly isTechnician = computed(() => this.session.user()?.role === 'TECHNICIAN');
  protected readonly roleLabel = computed(() => (this.isTechnician() ? 'Técnico' : 'Usuario'));
  protected readonly firstName = computed(() => displayName(this.session.user()?.name));
  protected readonly themeMeta = computed(() => THEME_META[this.theme.preference()]);

  protected readonly nav = computed<NavItem[]>(() =>
    this.isTechnician()
      ? [{ label: 'Bandeja', icon: 'inbox', link: '/technician/reports' }]
      : [
          { label: 'Mis reportes', icon: 'list', link: '/reports' },
          { label: 'Nuevo', icon: 'plus', link: '/reports', queryParams: { nuevo: '1' }, primary: true }
        ]
  );

  protected logout(): void {
    this.accountOpen.set(false);
    this.session.logout();
    this.feedback.toast('Sesión cerrada', 'info');
  }
}
