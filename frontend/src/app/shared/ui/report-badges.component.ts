import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReportPriority, ReportStatus } from '../../core/models/report.model';
import { PRIORITY_LABEL, PRIORITY_LEVEL, STATUS_LABEL, initials } from '../../core/utils/report-rules';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span [class]="'badge badge-' + status().toLowerCase()">{{ label() }}</span>`
})
export class StatusBadgeComponent {
  readonly status = input.required<ReportStatus>();
  protected readonly label = computed(() => STATUS_LABEL[this.status()]);
}

/** Prioridad como barras de señal: legible sin depender solo del color (WCAG 1.4.1). */
@Component({
  selector: 'app-priority',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="bars" [class.critical]="level() === 4" aria-hidden="true">
      @for (bar of [1, 2, 3, 4]; track bar) {
        <i [class.on]="bar <= level()"></i>
      }
    </span>
    @if (showLabel()) {
      <span class="label">{{ label() }}</span>
    } @else {
      <span class="sr-only">Prioridad {{ label() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
      color: var(--text-2);
      white-space: nowrap;
    }
    .bars {
      display: inline-flex;
      align-items: flex-end;
      gap: 2px;
      height: 12px;
    }
    i {
      width: 3px;
      border-radius: 1px;
      background: var(--border-strong);
    }
    i:nth-child(1) { height: 4px; }
    i:nth-child(2) { height: 7px; }
    i:nth-child(3) { height: 10px; }
    i:nth-child(4) { height: 12px; }
    i.on { background: var(--text-2); }
    .critical i.on { background: var(--critical); }
    :host:has(.critical) .label {
      color: var(--critical);
      font-weight: 600;
    }
  `
})
export class PriorityComponent {
  readonly priority = input.required<ReportPriority>();
  readonly showLabel = input(true);
  protected readonly level = computed(() => PRIORITY_LEVEL[this.priority()]);
  protected readonly label = computed(() => PRIORITY_LABEL[this.priority()]);
}

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.title]': 'name()' },
  template: `{{ letters() }}`,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: var(--avatar-size, 28px);
      height: var(--avatar-size, 28px);
      border-radius: 50%;
      background: var(--accent-soft);
      color: var(--accent-text);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    :host(.empty) {
      background: var(--surface-2);
      color: var(--text-3);
      border: 1px dashed var(--border-strong);
    }
  `
})
export class AvatarComponent {
  readonly name = input<string | null | undefined>(null);
  protected readonly letters = computed(() => (this.name() ? initials(this.name()) : ''));
}
