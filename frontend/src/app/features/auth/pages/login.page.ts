import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { HOME_BY_ROLE, SessionService } from '../../../core/services/session.service';
import { apiErrorMessage } from '../../../core/utils/report-rules';
import { BrandComponent } from '../../../shared/ui/brand.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { AvatarComponent, StatusBadgeComponent } from '../../../shared/ui/report-badges.component';

interface DemoAccount {
  label: string;
  detail: string;
  organizationSlug: string;
  email: string;
}

/** Cuentas ficticias de backend/db/seed.sql. Solo se muestran en desarrollo o en la demo pública. */
const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Carlos · Usuario', detail: 'Reporta incidentes', organizationSlug: 'utmach', email: 'user@example.test' },
  { label: 'Roberto · Técnico', detail: 'Atiende la bandeja', organizationSlug: 'utmach', email: 'tech@example.test' }
];
const DEMO_PASSWORD = 'Nexo123!';

/** Evita redirecciones abiertas: solo se aceptan rutas internas ("/x", nunca "//dominio" ni URLs absolutas). */
export function safeRedirect(next: string | undefined): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null;
}

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, BrandComponent, IconComponent, StatusBadgeComponent, AvatarComponent],
  template: `
    <div class="login">
      <section class="story" aria-hidden="true">
        <app-brand class="story-brand" />
        <div class="story-copy">
          <h2>Cada incidente, del reporte a la solución.</h2>
          <p>Los equipos reportan en segundos. Los técnicos priorizan, se asignan y cierran con trazabilidad.</p>
        </div>
        <div class="flow">
          <article class="flow-card">
            <div class="flow-row"><app-status-badge status="OPEN" /><span class="mono">#A41F2C</span></div>
            <strong>Sin WiFi en el aula 204</strong>
            <div class="flow-row"><span>Redes · Alta</span><span class="dashed">Sin asignar</span></div>
          </article>
          <article class="flow-card">
            <div class="flow-row"><app-status-badge status="IN_PROGRESS" /><span class="mono">#7C02B9</span></div>
            <strong>Proyector sin señal HDMI</strong>
            <div class="flow-row"><span>Equipos · Media</span><app-avatar name="Andrea Jaramillo" /></div>
          </article>
          <article class="flow-card">
            <div class="flow-row"><app-status-badge status="RESOLVED" /><span class="mono">#19E0D4</span></div>
            <strong>Licencia de software renovada</strong>
            <div class="flow-row"><span>Software · Crítica</span><app-avatar name="Roberto Sánchez" /></div>
          </article>
        </div>
        <p class="story-foot">Mesa de ayuda TI · multi-organización</p>
      </section>

      <section class="panel">
        <div class="panel-inner">
          <app-brand class="panel-brand" />
          <header>
            <h1>Inicia sesión</h1>
            <p class="muted">Usa la cuenta que te asignó tu organización.</p>
          </header>

          @if (reason() === 'expired') {
            <div class="notice" role="status"><app-icon name="clock" /> Tu sesión expiró. Vuelve a ingresar.</div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="field">
              <label class="field-label" for="org">Organización</label>
              <div class="input-icon">
                <app-icon name="building" [size]="16" />
                <input id="org" class="input" formControlName="organizationSlug" placeholder="utmach"
                  autocomplete="organization" autocapitalize="none" spellcheck="false"
                  [attr.aria-invalid]="invalid('organizationSlug')" aria-describedby="org-error" />
              </div>
              @if (invalid('organizationSlug')) {
                <p class="field-error" id="org-error"><app-icon name="alert" [size]="14" /> Indica el identificador de tu organización.</p>
              }
            </div>

            <div class="field">
              <label class="field-label" for="email">Correo</label>
              <input id="email" class="input" type="email" formControlName="email" placeholder="nombre@organizacion.edu.ec"
                autocomplete="username" autocapitalize="none" spellcheck="false" inputmode="email"
                [attr.aria-invalid]="invalid('email')" aria-describedby="email-error" />
              @if (invalid('email')) {
                <p class="field-error" id="email-error"><app-icon name="alert" [size]="14" /> Escribe un correo válido.</p>
              }
            </div>

            <div class="field">
              <label class="field-label" for="password">Contraseña</label>
              <div class="password">
                <input id="password" class="input" [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                  autocomplete="current-password" [attr.aria-invalid]="invalid('password')" aria-describedby="password-error" />
                <button type="button" class="btn btn-ghost btn-icon btn-sm reveal" (click)="showPassword.update(v => !v)"
                  [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'" [attr.aria-pressed]="showPassword()">
                  <app-icon [name]="showPassword() ? 'eye-off' : 'eye'" [size]="16" />
                </button>
              </div>
              @if (invalid('password')) {
                <p class="field-error" id="password-error"><app-icon name="alert" [size]="14" /> La contraseña es obligatoria.</p>
              }
            </div>

            @if (error()) {
              <div class="alert" role="alert"><app-icon name="alert" /> {{ error() }}</div>
            }

            <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner" aria-hidden="true"></span> Ingresando…
              } @else {
                Ingresar <app-icon name="arrow-right" [size]="16" />
              }
            </button>
          </form>

          @if (showDemo) {
            <div class="demo">
              <p class="demo-title">Cuentas de demostración <span class="mono">Nexo123!</span></p>
              <div class="demo-grid">
                @for (account of demoAccounts; track account.email) {
                  <button type="button" class="demo-account" (click)="useDemo(account)">
                    <app-avatar [name]="account.label.split(' · ')[0]" />
                    <span><strong>{{ account.label }}</strong><small>{{ account.detail }}</small></span>
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .login {
      min-height: 100dvh;
      display: grid;
    }
    .story { display: none; }
    .panel {
      display: grid;
      place-items: center;
      padding: 32px 20px calc(32px + env(safe-area-inset-bottom));
    }
    .panel-inner {
      width: 100%;
      max-width: 400px;
      animation: rise 300ms var(--ease);
    }
    .panel-brand { margin-bottom: 36px; }
    header { margin-bottom: 24px; }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    form { display: grid; }
    form > .btn { margin-top: 24px; }
    .alert { margin-top: 16px; }
    .notice {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 18px;
      padding: 10px 12px;
      border-radius: var(--r-md);
      background: var(--progress-soft);
      color: var(--progress);
      font-size: 14px;
    }
    .password { position: relative; }
    .password .input { padding-right: 48px; }
    .reveal {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
    }
    .demo {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px dashed var(--border-strong);
    }
    .demo-title {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-3);
      margin-bottom: 10px;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .demo-account {
      display: flex;
      gap: 10px;
      align-items: center;
      min-height: 56px;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      background: var(--surface);
      text-align: left;
      transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
    }
    .demo-account:hover { border-color: var(--accent); background: var(--accent-soft); }
    .demo-account span { display: grid; line-height: 1.25; min-width: 0; }
    .demo-account strong { font-size: 13px; }
    .demo-account small { font-size: 12px; color: var(--text-3); }

    @media (min-width: 1024px) {
      .login { grid-template-columns: minmax(420px, 1fr) minmax(480px, 1fr); }
      .panel-brand { display: none; }
      .story {
        --brand-text: #f4f4f2;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 40px;
        padding: 40px 56px;
        overflow: hidden;
        color: #f4f4f2;
        background:
          radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.07) 1px, transparent 0) 0 0 / 22px 22px,
          #111315;
      }
      .story-copy { max-width: 440px; margin-top: auto; }
      .story-copy h2 {
        font-size: 36px;
        font-weight: 650;
        letter-spacing: -0.03em;
        margin-bottom: 14px;
      }
      .story-copy p { color: #a9abb2; font-size: 16px; }
      .flow {
        display: grid;
        gap: 12px;
        max-width: 400px;
        margin-bottom: auto;
      }
      .flow-card {
        display: grid;
        gap: 10px;
        padding: 14px 16px;
        border-radius: var(--r-lg);
        background: #1a1c1f;
        border: 1px solid #2a2d31;
        color: #ededee;
        --open: #8aa8ff; --open-soft: rgb(110 145 255 / 0.14);
        --progress: #f2b45a; --progress-soft: rgb(242 180 90 / 0.13);
        --resolved: #6fd497; --resolved-soft: rgb(111 212 151 / 0.13);
        --accent-soft: rgb(60 199 180 / 0.16); --accent-text: #6be0cf;
        animation: rise 500ms var(--ease) backwards;
      }
      .flow-card:nth-child(2) { margin-left: 28px; animation-delay: 90ms; }
      .flow-card:nth-child(3) { margin-left: 56px; animation-delay: 180ms; }
      .flow-card strong { font-size: 15px; font-weight: 600; }
      .flow-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12.5px;
        color: #9a9ca3;
      }
      .dashed {
        padding: 2px 8px;
        border: 1px dashed #3b3f45;
        border-radius: var(--r-full);
      }
      .story-foot { font-size: 13px; color: #75777e; }
    }
  `
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  /** Parámetros de consulta enlazados por el router (withComponentInputBinding). */
  readonly next = input<string>();
  readonly reason = input<string>();

  protected readonly showDemo = !environment.production || environment.demoMode;
  protected readonly demoAccounts = DEMO_ACCOUNTS;
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    organizationSlug: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }

  protected useDemo(account: DemoAccount): void {
    this.form.setValue({ organizationSlug: account.organizationSlug, email: account.email, password: DEMO_PASSWORD });
    this.submit();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.error.set('');
    this.session.login(this.form.getRawValue()).subscribe({
      next: user => {
        const target = safeRedirect(this.next()) ?? HOME_BY_ROLE[user.role];
        void this.router.navigateByUrl(target);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          error.status === 0
            ? 'No hay conexión con el servidor. Verifica que la API esté en ejecución.'
            : apiErrorMessage(error, 'No fue posible iniciar sesión.')
        );
      }
    });
  }
}
