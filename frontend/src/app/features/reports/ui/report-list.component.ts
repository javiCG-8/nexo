import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Report } from '../../../core/models/report.model';
import { ClockService } from '../../../core/services/clock.service';
import { displayName, editTimeLeft, formatCountdown, nextStatus, relativeTime, shortId } from '../../../core/utils/report-rules';
import { IconComponent } from '../../../shared/ui/icon.component';
import { AvatarComponent, PriorityComponent, StatusBadgeComponent } from '../../../shared/ui/report-badges.component';

/**
 * Lista de reportes. Una sola estructura semántica (lista de artículos) que se presenta
 * como tarjetas en móvil y como filas alineadas en escritorio.
 */
@Component({
  selector: 'app-report-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, StatusBadgeComponent, PriorityComponent, AvatarComponent],
  template: `
    @if (loading()) {
      <ul class="list" aria-busy="true" aria-label="Cargando reportes">
        @for (row of [1, 2, 3, 4]; track row) {
          <li class="row skeleton"><span></span><span></span><span></span></li>
        }
      </ul>
    } @else if (reports().length === 0) {
      <ng-content select="[empty]" />
    } @else {
      <div class="head" aria-hidden="true">
        <span>Reporte</span><span>Estado</span><span>Prioridad</span><span>{{ technician() ? 'Responsable' : 'Técnico' }}</span><span>Actualizado</span><span></span>
      </div>
      <ul class="list" [attr.aria-label]="label()">
        @for (report of reports(); track report.id; let i = $index) {
          <li class="row" [style.animation-delay.ms]="i < 12 ? i * 25 : 0">
            <button type="button" class="row-main" (click)="opened.emit(report)" [attr.aria-label]="'Ver detalle: ' + report.title">
              <span class="title-line">
                <span class="id mono">{{ id(report.id) }}</span>
                <span class="category">{{ report.categoryName }}</span>
              </span>
              <strong class="title">{{ report.title }}</strong>
              @if (technician()) {
                <span class="reporter">Reportado por {{ name(report.reporterName) }}</span>
              }
            </button>

            <div class="cell status"><app-status-badge [status]="report.status" /></div>
            <div class="cell priority"><app-priority [priority]="report.priority" /></div>
            <div class="cell assignee">
              @if (report.technicianName) {
                <app-avatar [name]="report.technicianName" />
                <span class="assignee-name">{{ report.technicianId === currentUserId() ? 'Tú' : name(report.technicianName) }}</span>
              } @else {
                <app-avatar class="empty" name="" />
                <span class="assignee-name muted">Sin asignar</span>
              }
            </div>
            <div class="cell time">
              <app-icon name="clock" [size]="13" />
              <time [attr.datetime]="report.updatedAt">{{ ago(report.updatedAt) }}</time>
              @if (!technician() && timeLeft(report) > 0) {
                <span class="window" title="Tiempo restante para editar o cancelar">· editable {{ countdown(report) }}</span>
              }
            </div>

            <div class="cell actions">
              @if (technician()) {
                @if (!report.technicianId) {
                  <button type="button" class="btn btn-sm" [disabled]="busy().has(report.id)" (click)="assign.emit(report)">
                    <app-icon name="user-plus" [size]="15" /> Asignarme
                  </button>
                } @else if (report.technicianId === currentUserId() && next(report); as step) {
                  <button type="button" class="btn btn-sm" [class.btn-primary]="step === 'RESOLVED'"
                    [disabled]="busy().has(report.id)" (click)="advance.emit(report)">
                    <app-icon [name]="step === 'IN_PROGRESS' ? 'play' : 'check'" [size]="15" />
                    {{ step === 'IN_PROGRESS' ? 'Iniciar' : 'Resolver' }}
                  </button>
                }
              }
              <app-icon class="chevron" name="chevron-right" />
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host { display: block; }
    .head { display: none; }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }
    .row {
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        'main main'
        'status priority'
        'assignee time'
        'actions actions';
      gap: 10px 12px;
      padding: 14px 14px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-sm);
      animation: rise 260ms var(--ease) backwards;
      transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
    }
    .row:hover { border-color: var(--border-strong); }
    .row:has(.row-main:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
    .row-main {
      grid-area: main;
      display: grid;
      gap: 3px;
      text-align: left;
      outline: none;
    }
    /* Toda la tarjeta es clicable sin anidar botones. */
    .row-main::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }
    .title-line {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12.5px;
      color: var(--text-3);
    }
    .id { color: var(--text-3); }
    .title {
      font-size: 15.5px;
      font-weight: 600;
      line-height: 1.35;
      color: var(--text);
    }
    .reporter { font-size: 12.5px; color: var(--text-3); }
    .cell {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .status { grid-area: status; }
    .priority { grid-area: priority; justify-self: end; }
    .assignee { grid-area: assignee; font-size: 13px; }
    .assignee-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .time { grid-area: time; justify-self: end; gap: 5px; font-size: 12.5px; color: var(--text-3); }
    .window { color: var(--accent-text); font-weight: 600; }
    .actions {
      grid-area: actions;
      justify-content: flex-end;
      position: relative;
      z-index: 1;
    }
    .actions:not(:has(.btn)) { display: none; }
    .chevron { display: none; color: var(--text-3); }

    .skeleton {
      grid-template-areas: none;
      grid-template-columns: 1fr;
      gap: 10px;
      animation: none;
    }
    .skeleton span {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, var(--surface-2), var(--surface-hover), var(--surface-2));
      background-size: 200% 100%;
      animation: shimmer 1.2s linear infinite;
    }
    .skeleton span:nth-child(1) { width: 30%; }
    .skeleton span:nth-child(2) { width: 75%; height: 16px; }
    .skeleton span:nth-child(3) { width: 50%; }
    @keyframes shimmer { to { background-position: -200% 0; } }

    @media (min-width: 1024px) {
      :host {
        --cols: minmax(0, 1fr) 128px 112px 170px 150px 128px;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }
      .head {
        display: grid;
        grid-template-columns: var(--cols);
        gap: 16px;
        padding: 10px 20px;
        border-bottom: 1px solid var(--border);
        background: var(--surface-2);
        font-size: 12px;
        font-weight: 600;
        color: var(--text-3);
      }
      .list { gap: 0; }
      .row {
        grid-template-columns: var(--cols);
        grid-template-areas: 'main status priority assignee time actions';
        align-items: center;
        gap: 16px;
        padding: 12px 20px;
        border: 0;
        border-bottom: 1px solid var(--border);
        border-radius: 0;
        box-shadow: none;
      }
      .row:last-child { border-bottom: 0; }
      .row:hover { background: var(--surface-2); }
      .row:has(.row-main:focus-visible) { outline-offset: -2px; }
      .priority, .time { justify-self: start; }
      .title { font-size: 14.5px; }
      .actions:not(:has(.btn)) { display: flex; }
      .chevron { display: inline-flex; }
      .window { display: none; }
    }
  `
})
export class ReportListComponent {
  private readonly clock = inject(ClockService);

  readonly reports = input.required<Report[]>();
  readonly loading = input(false);
  readonly technician = input(false);
  readonly currentUserId = input<string | undefined>();
  readonly busy = input<ReadonlySet<string>>(new Set());
  readonly label = input('Reportes');

  readonly opened = output<Report>();
  readonly assign = output<Report>();
  readonly advance = output<Report>();

  protected id = shortId;
  protected name = displayName;
  protected next = (report: Report) => nextStatus(report.status);
  protected ago = (iso: string) => relativeTime(iso, this.clock.now());
  protected timeLeft = (report: Report) => editTimeLeft(report, this.clock.now());
  protected countdown = (report: Report) => formatCountdown(this.timeLeft(report));
}
