import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Report } from '../../../core/models/report.model';
import { ClockService } from '../../../core/services/clock.service';
import {
  STATUSES,
  STATUS_LABEL,
  STATUS_ORDER,
  displayName,
  editTimeLeft,
  formatCountdown,
  nextStatus,
  relativeTime,
  shortId
} from '../../../core/utils/report-rules';
import { IconComponent } from '../../../shared/ui/icon.component';
import { AvatarComponent, PriorityComponent } from '../../../shared/ui/report-badges.component';

@Component({
  selector: 'app-report-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IconComponent, PriorityComponent, AvatarComponent],
  template: `
    @let r = report();
    <p class="id-line"><span class="mono">{{ id(r.id) }}</span> · {{ r.categoryName }}</p>

    <ol class="stepper" aria-label="Progreso del reporte">
      @for (step of steps; track step) {
        <li [class.done]="order(step) < order(r.status)" [class.current]="step === r.status"
          [attr.aria-current]="step === r.status ? 'step' : null">
          <span class="dot">
            @if (order(step) < order(r.status) || (step === 'RESOLVED' && r.status === 'RESOLVED')) {
              <app-icon name="check" [size]="12" [stroke]="3" />
            }
          </span>
          <span class="step-label">{{ label(step) }}</span>
        </li>
      }
    </ol>

    <section class="block">
      <h3>Descripción</h3>
      <p class="description">{{ r.description }}</p>
    </section>

    @if (r.resolutionNotes) {
      <section class="solution">
        <h3><app-icon name="wrench" [size]="15" /> Solución aplicada</h3>
        <p>{{ r.resolutionNotes }}</p>
      </section>
    }

    <dl class="facts">
      <div><dt>Prioridad</dt><dd><app-priority [priority]="r.priority" /></dd></div>
      <div><dt>Categoría</dt><dd>{{ r.categoryName }}</dd></div>
      <div>
        <dt>Reportado por</dt>
        <dd class="person"><app-avatar [name]="r.reporterName" /> {{ name(r.reporterName) }}</dd>
      </div>
      <div>
        <dt>Técnico</dt>
        <dd class="person">
          @if (r.technicianName) {
            <app-avatar [name]="r.technicianName" /> {{ name(r.technicianName) }}
          } @else {
            <span class="muted">Sin asignar</span>
          }
        </dd>
      </div>
      <div><dt>Creado</dt><dd><time [attr.datetime]="r.createdAt" [title]="r.createdAt | date: 'medium'">{{ r.createdAt | date: "d MMM y, HH:mm" }}</time></dd></div>
      <div><dt>Última actividad</dt><dd>{{ ago(r.updatedAt) }}</dd></div>
    </dl>

    <div class="actions">
      @if (technician()) {
        @if (!r.technicianId) {
          <button type="button" class="btn btn-primary btn-lg btn-block" [disabled]="busy()" (click)="assign.emit(r)">
            <app-icon name="user-plus" /> Asignármelo
          </button>
        } @else if (r.technicianId === currentUserId() && next(); as step) {
          <button type="button" class="btn btn-primary btn-lg btn-block" [disabled]="busy()" (click)="advance.emit(r)">
            <app-icon [name]="step === 'IN_PROGRESS' ? 'play' : 'check'" />
            {{ step === 'IN_PROGRESS' ? 'Iniciar atención' : 'Marcar como resuelto' }}
          </button>
        } @else if (r.technicianId !== currentUserId() && r.status !== 'RESOLVED') {
          <p class="hint"><app-icon name="lock" [size]="14" /> Asignado a otro técnico.</p>
        }
      } @else {
        @if (timeLeft() > 0) {
          <div class="window" role="timer" aria-live="off">
            <app-icon name="clock" [size]="15" />
            <span>Puedes editar o cancelar durante <strong class="mono">{{ countdown() }}</strong></span>
          </div>
          <div class="pair">
            <button type="button" class="btn btn-lg" [disabled]="busy()" (click)="edit.emit(r)">
              <app-icon name="pencil" /> Editar
            </button>
            <button type="button" class="btn btn-danger btn-lg" [disabled]="busy()" (click)="cancel.emit(r)">
              <app-icon name="trash" /> Cancelar
            </button>
          </div>
        } @else if (r.status !== 'RESOLVED') {
          <p class="hint">
            <app-icon name="info" [size]="14" />
            {{ r.technicianId ? 'Un técnico ya está atendiendo tu reporte.' : 'Tu reporte está en cola. Un técnico lo tomará pronto.' }}
          </p>
        }
      }
    </div>
  `,
  styles: `
    :host { display: grid; gap: 20px; }
    .id-line { font-size: 13px; color: var(--text-3); margin-top: -8px; }
    .stepper {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
    .stepper li {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: var(--text-3);
    }
    .stepper li::before {
      content: '';
      position: absolute;
      top: 10px;
      right: 50%;
      width: 100%;
      height: 2px;
      background: var(--border);
      z-index: 0;
    }
    .stepper li:first-child::before { display: none; }
    .stepper li.done::before, .stepper li.current::before { background: var(--accent); }
    .dot {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid var(--border-strong);
      background: var(--surface);
      color: var(--on-accent);
    }
    .done .dot { background: var(--accent); border-color: var(--accent); }
    .current .dot { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
    .current:last-child .dot { background: var(--accent); }
    .current .step-label { color: var(--text); font-weight: 600; }

    h3 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-3);
      margin-bottom: 6px;
    }
    .description { white-space: pre-wrap; color: var(--text); }
    .solution {
      padding: 14px 16px;
      border-radius: var(--r-md);
      background: var(--resolved-soft);
      border: 1px solid color-mix(in srgb, var(--resolved) 25%, transparent);
    }
    .solution h3 { color: var(--resolved); }
    .solution p { white-space: pre-wrap; }
    .facts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 16px;
      padding: 16px;
      border-radius: var(--r-md);
      background: var(--surface-2);
    }
    .facts dt { font-size: 12px; color: var(--text-3); margin-bottom: 3px; }
    .facts dd { font-size: 14px; }
    .person { display: flex; align-items: center; gap: 8px; }
    .actions { display: grid; gap: 10px; }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .window, .hint {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      color: var(--text-2);
    }
    .window { color: var(--accent-text); }
  `
})
export class ReportDetailComponent {
  private readonly clock = inject(ClockService);

  readonly report = input.required<Report>();
  readonly technician = input(false);
  readonly currentUserId = input<string | undefined>();
  readonly busy = input(false);

  readonly assign = output<Report>();
  readonly advance = output<Report>();
  readonly edit = output<Report>();
  readonly cancel = output<Report>();

  protected readonly steps = STATUSES;
  protected readonly next = computed(() => nextStatus(this.report().status));
  protected readonly timeLeft = computed(() => editTimeLeft(this.report(), this.clock.now()));
  protected readonly countdown = computed(() => formatCountdown(this.timeLeft()));

  protected id = shortId;
  protected name = displayName;
  protected label = (status: Report['status']) => STATUS_LABEL[status];
  protected order = (status: Report['status']) => STATUS_ORDER[status];
  protected ago = (iso: string) => relativeTime(iso, this.clock.now());
}
