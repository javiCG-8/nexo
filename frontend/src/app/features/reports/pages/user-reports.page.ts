import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Report, ReportPayload } from '../../../core/models/report.model';
import { SessionService } from '../../../core/services/session.service';
import { apiErrorMessage, displayName, shortId } from '../../../core/utils/report-rules';
import { FeedbackService } from '../../../shared/ui/feedback.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SheetComponent } from '../../../shared/ui/sheet.component';
import { ReportsStore } from '../data/reports.store';
import { PAGE_STYLES } from '../ui/page-styles';
import { ReportDetailComponent } from '../ui/report-detail.component';
import { ReportFiltersComponent } from '../ui/report-filters.component';
import { ReportFormComponent } from '../ui/report-form.component';
import { ReportListComponent } from '../ui/report-list.component';

@Component({
  selector: 'app-user-reports-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ReportsStore],
  imports: [IconComponent, SheetComponent, ReportListComponent, ReportFiltersComponent, ReportDetailComponent, ReportFormComponent],
  template: `
    <header class="page-head">
      <div>
        <h1>Hola, {{ firstName() }}</h1>
        <p>{{ summary() }}</p>
      </div>
      <button type="button" class="btn btn-primary btn-lg desktop-only" (click)="openCreate()">
        <app-icon name="plus" /> Nuevo reporte
      </button>
    </header>

    @if (store.error()) {
      <div class="alert" role="alert">
        <app-icon name="alert" /> <span>{{ store.error() }}</span>
        <button type="button" class="btn btn-sm" (click)="store.load()">Reintentar</button>
      </div>
    }

    @if (store.reports().length > 0 || store.loading()) {
      <app-report-filters />
    }

    <app-report-list
      [reports]="store.filtered()"
      [loading]="store.loading()"
      label="Mis reportes"
      (opened)="selectedId.set($event.id)"
    >
      <div empty class="empty">
        @if (store.reports().length === 0) {
          <span class="empty-icon"><app-icon name="inbox" [size]="26" /></span>
          <h2>Todo en orden por ahora</h2>
          <p>Cuando algo falle (un equipo, la red, un programa) repórtalo aquí y sigue su avance en tiempo real.</p>
          <button type="button" class="btn btn-primary btn-lg" (click)="openCreate()"><app-icon name="plus" /> Crear mi primer reporte</button>
        } @else {
          <span class="empty-icon"><app-icon name="search" [size]="24" /></span>
          <h2>Sin coincidencias</h2>
          <p>Ningún reporte coincide con los filtros aplicados.</p>
          <button type="button" class="btn" (click)="store.clearFilters()">Limpiar filtros</button>
        }
      </div>
    </app-report-list>

    @if (selected(); as report) {
      <app-sheet [open]="true" [heading]="report.title" eyebrow="Detalle del reporte" (closed)="selectedId.set(null)">
        <app-report-detail
          [report]="report"
          [busy]="store.busy().has(report.id)"
          (edit)="openEdit($event)"
          (cancel)="cancel($event)"
        />
      </app-sheet>
    }

    <app-sheet
      [open]="formOpen()"
      [heading]="editing() ? 'Editar reporte' : 'Nuevo reporte'"
      [eyebrow]="editing() ? id(editing()!.id) : 'Cuéntanos qué pasa'"
      (closed)="closeForm()"
    >
      <app-report-form
        [categories]="store.categories()"
        [report]="editing()"
        [submitting]="saving()"
        (saved)="save($event)"
        (dismissed)="closeForm()"
      />
    </app-sheet>
  `,
  styles: PAGE_STYLES
})
export class UserReportsPage {
  protected readonly store = inject(ReportsStore);
  private readonly session = inject(SessionService);
  private readonly feedback = inject(FeedbackService);
  private readonly router = inject(Router);

  /** `?nuevo=1` (desde la pestaña "Nuevo" en móvil) abre el formulario. */
  readonly nuevo = input<string>();

  protected readonly selectedId = signal<string | null>(null);
  protected readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? (this.store.reports().find(r => r.id === id) ?? null) : null;
  });
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Report | null>(null);
  protected readonly saving = signal(false);

  protected readonly firstName = computed(() => displayName(this.session.user()?.name).split(' ')[0] || 'de nuevo');
  protected readonly summary = computed(() => {
    const { ALL, RESOLVED } = this.store.counts();
    const active = ALL - RESOLVED;
    if (this.store.loading()) return 'Cargando tus reportes…';
    if (ALL === 0) return 'Aún no has creado reportes.';
    return active === 0
      ? 'Todos tus reportes están resueltos.'
      : `Tienes ${active} ${active === 1 ? 'reporte activo' : 'reportes activos'}.`;
  });

  protected id = shortId;

  constructor() {
    this.store.load({ withCategories: true });
    effect(() => {
      if (this.nuevo()) {
        this.openCreate();
        void this.router.navigate([], { queryParams: { nuevo: null }, replaceUrl: true });
      }
    });
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.selectedId.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(report: Report): void {
    this.selectedId.set(null);
    this.editing.set(report);
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected save(payload: ReportPayload): void {
    const editing = this.editing();
    this.saving.set(true);
    const request = editing ? this.store.update(editing.id, payload) : this.store.create(payload);
    request.subscribe({
      next: report => {
        this.saving.set(false);
        this.closeForm();
        this.feedback.toast(editing ? 'Cambios guardados' : `Reporte ${shortId(report.id)} enviado. Te avisaremos del avance aquí.`);
      },
      error: error => {
        this.saving.set(false);
        this.feedback.toast(apiErrorMessage(error), 'error');
      }
    });
  }

  protected async cancel(report: Report): Promise<void> {
    const confirmed = await this.feedback.confirm({
      title: '¿Cancelar este reporte?',
      message: `"${report.title}" se eliminará y ningún técnico lo atenderá. Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, cancelar reporte',
      tone: 'danger'
    });
    if (!confirmed) return;
    this.store.cancel(report.id).subscribe({
      next: () => {
        this.selectedId.set(null);
        this.feedback.toast('Reporte cancelado', 'info');
      },
      error: error => this.feedback.toast(apiErrorMessage(error), 'error')
    });
  }
}
