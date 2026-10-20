import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeedbackService } from './feedback.service';
import { IconComponent } from './icon.component';
import { SheetComponent } from './sheet.component';

/** Punto único donde se pintan los toasts y el diálogo de confirmación. */
@Component({
  selector: 'app-feedback-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, SheetComponent],
  template: `
    <div class="toasts" role="region" aria-label="Notificaciones" aria-live="polite">
      @for (toast of feedback.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.tone" [attr.role]="toast.tone === 'error' ? 'alert' : 'status'">
          <app-icon [name]="toast.tone === 'error' ? 'alert' : toast.tone === 'info' ? 'info' : 'check-circle'" />
          <span>{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="feedback.dismiss(toast.id)" aria-label="Descartar">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>

    @if (feedback.confirmation(); as request) {
      <app-sheet [open]="true" [heading]="request.title" variant="center" (closed)="feedback.settle(false)">
        <p class="confirm-message">{{ request.message }}</p>
        <div class="confirm-actions">
          <button type="button" class="btn" (click)="feedback.settle(false)">Volver</button>
          <button
            type="button"
            class="btn"
            [class.btn-danger-solid]="request.tone === 'danger'"
            [class.btn-primary]="request.tone !== 'danger'"
            (click)="feedback.settle(true)"
          >
            {{ request.confirmLabel }}
          </button>
        </div>
      </app-sheet>
    }
  `,
  styles: `
    .toasts {
      position: fixed;
      z-index: 900;
      left: 16px;
      right: 16px;
      bottom: calc(var(--tabbar-h) + 16px + env(safe-area-inset-bottom));
      display: grid;
      gap: 8px;
      justify-items: center;
      pointer-events: none;
    }
    @media (min-width: 1024px) {
      .toasts {
        left: var(--sidebar-w);
        right: 0;
        bottom: 24px;
      }
    }
    .toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 46px;
      max-width: 420px;
      padding: 8px 8px 8px 14px;
      border-radius: var(--r-md);
      background: var(--text);
      color: var(--bg);
      box-shadow: var(--shadow-md);
      font-size: 14px;
      font-weight: 500;
      animation: rise 220ms var(--ease);
    }
    .toast-success app-icon { color: var(--resolved-soft); }
    .toast-error { background: var(--danger); color: #fff; }
    .toast-close {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: var(--r-xs);
      color: inherit;
      opacity: 0.7;
    }
    .toast-close:hover { opacity: 1; }
    .confirm-message {
      color: var(--text-2);
    }
    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
    }
  `
})
export class FeedbackHostComponent {
  protected readonly feedback = inject(FeedbackService);
}
