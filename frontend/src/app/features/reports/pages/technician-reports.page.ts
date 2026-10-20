import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { Report } from '../../../core/models/report.model';
import { SessionService } from '../../../core/services/session.service';
import { apiErrorMessage, nextStatus, shortId } from '../../../core/utils/report-rules';
import { FeedbackService } from '../../../shared/ui/feedback.service';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { SheetComponent } from '../../../shared/ui/sheet.component';
import { ReportsStore } from '../data/reports.store';
import { PAGE_STYLES } from '../ui/page-styles';
import { ReportBoardComponent } from '../ui/report-board.component';
import { ReportDetailComponent } from '../ui/report-detail.component';
import { ReportFiltersComponent } from '../ui/report-filters.component';
import { ReportListComponent } from '../ui/report-list.component';
import { ResolveFormComponent } from '../ui/resolve-form.component';

type Scope = 'all' | 'unassigned' | 'mine';
type View = 'list' | 'board';
const VIEW_KEY = 'nexo_tech_view';
const REFRESH_MS = 30_000;

@Component({
  selector: 'app-technician-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReportsStore],
  imports: [
    IconComponent,
    SheetComponent,
    ReportListComponent,
    ReportBoardComponent,
    ReportFiltersComponent,
    ReportDetailComponent,
    ResolveFormComponent
  ],
  template: `
    <header class="page-head">
      <div>
        <h1>Bandeja de soporte</h1>
        <p>{{ session.user()?.organizationSlug?.toUpperCase() }} · se actualiza automáticamente</p>
      </div>
      <div class="head-actions">
        <div class="view-toggle" role="radiogroup" aria-label="Vista">
          <button type="button" role="radio" [attr.aria-checked]="view() === 'list'" (click)="setView('list')" title="Lista">
            <app-icon name="list" /><span class="sr-only">Lista</span>
          </button>
          <button type="button" role="radio" [attr.aria-checked]="view() === 'board'" (click)="setView('board')" title="Tablero">
            <app-icon name="board" /><span class="sr-only">Tablero</span>
          </button>
        </div>
        <button type="button" class="btn btn-icon" (click)="store.load()" aria-label="Actualizar" title="Actualizar">
          <app-icon name="refresh" />
        </button>
      </div>
    </header>

    <section class="kpis" aria-label="Resumen">
      @for (kpi of kpis(); track kpi.scope) {
        <button type="button" class="kpi" [class.active]="scope() === kpi.scope" [attr.aria-pressed]="scope() === kpi.scope"
          (click)="setScope(kpi.scope)">
          <span class="kpi-icon"><app-icon [name]="kpi.icon" [size]="16" /></span>
          <span class="kpi-label">{{ kpi.label }}</span>
          <strong class="kpi-value">{{ kpi.value }}</strong>
          <span class="kpi-hint">{{ kpi.hint }}</span>
        </button>
      }
    </section>

    @if (store.error()) {
      <div class="alert" role="alert">
        <app-icon name="alert" /> <span>{{ store.error() }}</span>
        <button type="button" class="btn btn-sm" (click)="store.load()">Reintentar</button>
      </div>
    }

    <app-report-filters />

    @if (view() === 'list') {
      <app-report-list
        [reports]="store.filtered()"
        [loading]="store.loading()"
        [technician]="true"
        [currentUserId]="userId()"
        [busy]="store.busy()"
        label="Bandeja de reportes"
        (opened)="selectedId.set($event.id)"
        (assign)="assign($event)"
        (advance)="advance($event)"
      >
        <div empty class="empty">
          <span class="empty-icon"><app-icon name="check-circle" [size]="26" /></span>
          <h2>{{ store.hasActiveFilters() || scope() !== 'all' ? 'Sin coincidencias' : 'Bandeja vacía' }}</h2>
          <p>{{ store.hasActiveFilters() || scope() !== 'all' ? 'Prueba con otros filtros.' : 'No hay reportes en tu organización. Buen trabajo.' }}</p>
          @if (store.hasActiveFilters() || scope() !== 'all') {
            <button type="button" class="btn" (click)="store.clearFilters(); setScope('all')">Ver todo</button>
          }
        </div>
      </app-report-list>
    } @else {
      <app-report-board
        [reports]="store.filteredAnyStatus()"
        [currentUserId]="userId()"
        [busy]="store.busy()"
        (opened)="selectedId.set($event.id)"
        (assign)="assign($event)"
        (advance)="advance($event)"
      />
    }

    @if (selected(); as report) {
      <app-sheet [open]="!resolving()" [heading]="report.title" eyebrow="Detalle del reporte" (closed)="closeDetail()">
        <app-report-detail
          [report]="report"
          [technician]="true"
          [currentUserId]="userId()"
          [busy]="store.busy().has(report.id)"
          (assign)="assign($event)"
          (advance)="advance($event)"
        />
      </app-sheet>
    }

    @if (resolving(); as report) {
      <app-sheet [open]="true" heading="Resolver reporte" [eyebrow]="id(report.id) + ' · ' + report.title" variant="center"
        (closed)="resolving.set(null)">
        <app-resolve-form [report]="report" [submitting]="store.busy().has(report.id)"
          (resolved)="resolve(report, $event)" (dismissed)="resolving.set(null)" />
      </app-sheet>
    }
  `,
  styles: [
    PAGE_STYLES,
    `
      .view-toggle {
        display: inline-flex;
        padding: 3px;
        border: 1px solid var(--border);
        border-radius: var(--r-sm);
        background: var(--surface);
      }
      .view-toggle button {
        display: grid;
        place-items: center;
        width: 36px;
        height: 32px;
        border-radius: var(--r-xs);
        color: var(--text-3);
      }
      .view-toggle button[aria-checked='true'] { background: var(--surface-2); color: var(--text); }
      .kpis {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .kpi {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-areas: 'icon label' 'value value' 'hint hint';
        align-items: center;
        gap: 4px 8px;
        padding: 12px;
        text-align: left;
        border: 1px solid var(--border);
        border-radius: var(--r-lg);
        background: var(--surface);
        box-shadow: var(--shadow-sm);
        transition: border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease);
      }
      .kpi:hover { border-color: var(--border-strong); }
      .kpi.active { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
      .kpi-icon {
        grid-area: icon;
        display: grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border-radius: 8px;
        background: var(--surface-2);
        color: var(--text-2);
      }
      .kpi.active .kpi-icon { background: var(--accent-soft); color: var(--accent-text); }
      .kpi-label { grid-area: label; font-size: 12.5px; font-weight: 600; color: var(--text-2); }
      .kpi-value { grid-area: value; font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
      .kpi-hint { grid-area: hint; font-size: 12px; color: var(--text-3); display: none; }
      @media (min-width: 768px) {
        .kpis { gap: 12px; }
        .kpi { padding: 16px; }
        .kpi-hint { display: block; }
        .kpi-value { font-size: 30px; }
      }
    `
  ]
})
export class TechnicianReportsPage {
  protected readonly store = inject(ReportsStore);
  protected readonly session = inject(SessionService);
  private readonly feedback = inject(FeedbackService);

  protected readonly userId = computed(() => this.session.user()?.id);
  protected readonly scope = signal<Scope>('all');
  protected readonly view = signal<View>(this.readView());
  protected readonly selectedId = signal<string | null>(null);
  protected readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? (this.store.reports().find(r => r.id === id) ?? null) : null;
  });
  protected readonly resolving = signal<Report | null>(null);

  protected readonly kpis = computed<{ scope: Scope; label: string; value: number; hint: string; icon: IconName }[]>(() => {
    const reports = this.store.reports();
    const me = this.userId();
    const unassigned = reports.filter(r => !r.technicianId && r.status !== 'RESOLVED');
    const mine = reports.filter(r => r.technicianId === me && r.status !== 'RESOLVED');
    const critical = unassigned.filter(r => r.priority === 'CRITICAL').length;
    return [
      { scope: 'unassigned', label: 'Sin asignar', value: unassigned.length, icon: 'inbox',
        hint: critical ? `${critical} crítico${critical > 1 ? 's' : ''} esperando` : 'Nada crítico esperando' },
      { scope: 'mine', label: 'Míos activos', value: mine.length, icon: 'user', hint: 'Asignados a ti, sin resolver' },
      { scope: 'all', label: 'Total', value: reports.length, icon: 'list', hint: 'Toda la organización' }
    ];
  });

  protected id = shortId;

  constructor() {
    this.store.load({ withCategories: true });

    effect(() => {
      const scope = this.scope();
      const me = this.userId();
      this.store.scope.set(
        scope === 'unassigned' ? r => !r.technicianId : scope === 'mine' ? r => r.technicianId === me : () => true
      );
    });

    // Actualización en segundo plano mientras la pestaña está visible.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !this.store.busy().size) this.store.load({ silent: true });
    }, REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected setScope(scope: Scope): void {
    this.scope.set(this.scope() === scope && scope !== 'all' ? 'all' : scope);
  }

  protected setView(view: View): void {
    this.view.set(view);
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // Preferencia no persistente.
    }
  }

  protected closeDetail(): void {
    if (!this.resolving()) this.selectedId.set(null);
  }

  protected assign(report: Report): void {
    this.store.assign(report.id).subscribe({
      next: () => this.feedback.toast(`${shortId(report.id)} asignado a ti`),
      error: error => {
        this.feedback.toast(apiErrorMessage(error), 'error');
        this.store.load({ silent: true });
      }
    });
  }

  protected advance(report: Report): void {
    const next = nextStatus(report.status);
    if (next === 'RESOLVED') {
      this.resolving.set(report);
      return;
    }
    if (next) {
      this.store.changeStatus(report.id, next).subscribe({
        next: () => this.feedback.toast(`${shortId(report.id)} en proceso`),
        error: error => this.feedback.toast(apiErrorMessage(error), 'error')
      });
    }
  }

  protected resolve(report: Report, notes: string): void {
    this.store.changeStatus(report.id, 'RESOLVED', notes).subscribe({
      next: () => {
        this.resolving.set(null);
        this.feedback.toast(`${shortId(report.id)} resuelto. El usuario ya puede ver la solución.`);
      },
      error: error => this.feedback.toast(apiErrorMessage(error), 'error')
    });
  }

  private readView(): View {
    try {
      return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'list';
    } catch {
      return 'list';
    }
  }
}
