import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Report, ReportStatus } from '../../../core/models/report.model';
import { ClockService } from '../../../core/services/clock.service';
import { STATUSES, STATUS_LABEL, displayName, nextStatus, relativeTime, shortId } from '../../../core/utils/report-rules';
import { IconComponent } from '../../../shared/ui/icon.component';
import { AvatarComponent, PriorityComponent } from '../../../shared/ui/report-badges.component';

/** Tablero Kanban por estado. En móvil las columnas se desplazan horizontalmente con snap. */
@Component({
  selector: 'app-report-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, PriorityComponent, AvatarComponent],
  template: `
    <div class="board">
      @for (column of columns(); track column.status) {
        <section class="column" [attr.aria-labelledby]="'col-' + column.status">
          <h2 [id]="'col-' + column.status" [class]="'column-title tone-' + column.status.toLowerCase()">
            {{ column.label }} <span class="count">{{ column.items.length }}</span>
          </h2>
          <ul class="cards">
            @for (report of column.items; track report.id) {
              <li class="card">
                <button type="button" class="card-main" (click)="opened.emit(report)" [attr.aria-label]="'Ver detalle: ' + report.title">
                  <span class="meta"><span class="mono">{{ id(report.id) }}</span> · {{ report.categoryName }}</span>
                  <strong>{{ report.title }}</strong>
                </button>
                <div class="foot">
                  <app-priority [priority]="report.priority" />
                  <span class="who">
                    <span class="muted">{{ ago(report.updatedAt) }}</span>
                    @if (report.technicianName) {
                      <app-avatar [name]="report.technicianName" />
                    }
                  </span>
                </div>
                @if (!report.technicianId) {
                  <button type="button" class="btn btn-sm btn-block" [disabled]="busy().has(report.id)" (click)="assign.emit(report)">
                    <app-icon name="user-plus" [size]="15" /> Asignarme
                  </button>
                } @else if (report.technicianId === currentUserId() && next(report); as step) {
                  <button type="button" class="btn btn-sm btn-block" [class.btn-primary]="step === 'RESOLVED'"
                    [disabled]="busy().has(report.id)" (click)="advance.emit(report)">
                    <app-icon [name]="step === 'IN_PROGRESS' ? 'play' : 'check'" [size]="15" />
                    {{ step === 'IN_PROGRESS' ? 'Iniciar atención' : 'Resolver' }}
                  </button>
                }
              </li>
            } @empty {
              <li class="empty">Nada por aquí</li>
            }
          </ul>
        </section>
      }
    </div>
  `,
  styles: `
    .board {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(280px, 86%);
      gap: 12px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      margin: 0 -16px;
      padding: 0 16px 8px;
    }
    @media (min-width: 1024px) {
      .board {
        grid-auto-flow: initial;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        overflow: visible;
        margin: 0;
        padding: 0;
      }
    }
    .column {
      scroll-snap-align: start;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      border-radius: var(--r-lg);
      background: var(--surface-2);
      border: 1px solid var(--border);
      min-height: 200px;
    }
    .column-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 4px;
      font-size: 13.5px;
      font-weight: 650;
    }
    .column-title::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .tone-open { color: var(--open); }
    .tone-in_progress { color: var(--progress); }
    .tone-resolved { color: var(--resolved); }
    .count {
      margin-left: auto;
      padding: 0 8px;
      border-radius: var(--r-full);
      background: var(--surface);
      color: var(--text-2);
      font-size: 12px;
    }
    .cards {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .card {
      position: relative;
      display: grid;
      gap: 10px;
      padding: 12px;
      border-radius: var(--r-md);
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      animation: rise 240ms var(--ease) backwards;
    }
    .card:hover { border-color: var(--border-strong); }
    .card-main {
      display: grid;
      gap: 4px;
      text-align: left;
    }
    .card-main::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }
    .card .btn { position: relative; z-index: 1; }
    .meta { font-size: 12px; color: var(--text-3); }
    .card strong { font-size: 14px; font-weight: 600; line-height: 1.35; }
    .foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }
    .who { display: inline-flex; align-items: center; gap: 8px; }
    .empty {
      padding: 24px 8px;
      text-align: center;
      font-size: 13px;
      color: var(--text-3);
      border: 1px dashed var(--border-strong);
      border-radius: var(--r-md);
    }
  `
})
export class ReportBoardComponent {
  private readonly clock = inject(ClockService);

  readonly reports = input.required<Report[]>();
  readonly currentUserId = input<string | undefined>();
  readonly busy = input<ReadonlySet<string>>(new Set());
  readonly opened = output<Report>();
  readonly assign = output<Report>();
  readonly advance = output<Report>();

  protected readonly columns = computed(() =>
    STATUSES.map((status: ReportStatus) => ({
      status,
      label: STATUS_LABEL[status],
      items: this.reports().filter(r => r.status === status)
    }))
  );

  protected id = shortId;
  protected name = displayName;
  protected next = (report: Report) => nextStatus(report.status);
  protected ago = (iso: string) => relativeTime(iso, this.clock.now());
}
