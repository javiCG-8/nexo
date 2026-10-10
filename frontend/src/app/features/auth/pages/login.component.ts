import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <div class="page-heading">
          <p class="eyebrow">Mesa de Ayuda TI</p>
          <h1>Nexo</h1>
          <p>Ingrese sus credenciales de acceso</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <label for="organizationSlug">Organización</label>
          <input
            id="organizationSlug"
            formControlName="organizationSlug"
            placeholder="utmach"
          />
          @if (form.controls.organizationSlug.invalid && form.controls.organizationSlug.touched) {
            <small class="field-error">Organización requerida.</small>
          }

          <label for="email" style="margin-top: 10px;">Correo electrónico</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="usuario@utmach.edu.ec"
            autocomplete="email"
          />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <small class="field-error">Correo no válido.</small>
          }

          <label for="password" style="margin-top: 10px;">Contraseña</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            placeholder="••••••••"
            autocomplete="current-password"
          />
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <small class="field-error">Contraseña requerida.</small>
          }

          @if (error) {
            <div class="error-message" role="alert">{{ error }}</div>
          }

          <button
            class="button button-primary button-wide"
            type="submit"
            [disabled]="loading"
          >
            {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
          </button>

          <div class="quick-login-buttons">
            <div class="quick-login-title">Credenciales de prueba</div>
            <div class="quick-buttons-grid">
              <button
                type="button"
                class="button button-secondary button-small"
                (click)="fillDemo('utmach', 'user@example.test', 'Nexo123!')"
              >
                Usuario
              </button>
              <button
                type="button"
                class="button button-secondary button-small"
                (click)="fillDemo('utmach', 'tech@example.test', 'Nexo123!')"
              >
                Técnico
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    organizationSlug: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';

  fillDemo(org: string, email: string, pass: string): void {
    this.form.setValue({
      organizationSlug: org,
      email: email,
      password: pass
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.getRawValue()).subscribe({
      next: ({ user }) => void this.router.navigate([user.role === 'TECHNICIAN' ? '/technician/reports' : '/reports']),
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.error?.message ?? 'No fue posible iniciar sesión con las credenciales ingresadas.';
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
