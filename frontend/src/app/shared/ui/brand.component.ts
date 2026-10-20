import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Marca de Nexo: dos nodos enlazados (nexo = vínculo entre quien reporta y quien resuelve). */
@Component({
  selector: 'app-brand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="mark" [attr.width]="size()" [attr.height]="size()" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--brand-bg, var(--accent))" />
      <circle cx="11" cy="11" r="3.6" fill="var(--brand-fg, var(--on-accent))" />
      <circle cx="21" cy="21" r="3.6" fill="none" stroke="var(--brand-fg, var(--on-accent))" stroke-width="2.4" />
      <path d="M13.6 13.6 18.4 18.4" stroke="var(--brand-fg, var(--on-accent))" stroke-width="2.4" stroke-linecap="round" />
    </svg>
    @if (showName()) {
      <span class="name">nexo</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .name {
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: var(--brand-text, var(--text));
    }
  `
})
export class BrandComponent {
  readonly size = input(30);
  readonly showName = input(true);
}
