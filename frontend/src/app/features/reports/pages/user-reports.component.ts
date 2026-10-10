import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/components/navbar.component';
import { MensajeErrorComponent } from '../../../shared/components/mensaje-error.component';
import { IndicadorCargaComponent } from '../../../shared/components/indicador-carga.component';
import { Category } from '../../../core/models/category.model';
import { CreateReportRequest, Report, ReportPriority, ReportStatus } from '../../../core/models/report.model';
import { ReportService } from '../services/report.service';
import { ReportFormComponent } from '../components/report-form.component';
import { ReportTableComponent } from '../components/report-table.component';
import { StatusBadgeComponent } from '../components/status-badge.component';

@Component({
  selector: 'app-user-reports',
  standalone: true,
  imports: [
    DatePipe,
    NavbarComponent,
    MensajeErrorComponent,
    IndicadorCargaComponent,
    ReportFormComponent,
    ReportTableComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-navbar />

    <main class="workspace">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Panel de Usuario</p>
          <h1>Mis Reportes de Soporte</h1>
        </div>
        <button class="button button-primary" (click)="drawer.set(true)">
          Nuevo Reporte
        </button>
      </header>

      @if (error) {
        <app-mensaje-error [message]="error" />
      }

      <section class="stats-grid">
        @for (card of cards(); track card.status) {
          <button
            class="stat-card"
            [class.selected]="statusFilter() === card.status"
            (click)="toggleStatus(card.status)"
          >
            <span>{{ card.label }}</span>
            <strong>{{ card.count }}</strong>
          </button>
        }
      </section>

      <section class="panel table-panel">
        <div class="toolbar">
          <div class="search-field">
            <label for="search">Buscar</label>
            <input
              id="search"
              placeholder="Filtrar por título..."
              (input)="search.set($any($event.target).value)"
            />
          </div>

          <div>
            <label for="priority-filter">Prioridad</label>
            <select id="priority-filter" (change)="priority.set($any($event.target).value)">
              <option value="">Todas</option>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>

          <div>
            <label for="category-filter">Categoría</label>
            <select id="category-filter" (change)="category.set($any($event.target).value)">
              <option value="">Todas</option>
              @for (item of categories; track item.id) {
                <option [value]="item.id">{{ item.name }}</option>
              }
            </select>
          </div>
        </div>

        @if (loading) {
          <app-indicador-carga message="Cargando reportes..." />
        } @else {
          <app-report-table
            [reports]="filteredReports()"
            (selected)="detail.set($event)"
          />
        }
      </section>
    </main>

    <app-report-form
      [categories]="categories"
      [open]="drawer()"
      [submitting]="sending()"
      (close)="drawer.set(false)"
      (created)="create($event)"
    />

    @if (detail(); as report) {
      <div class="detail-backdrop" (click)="detail.set(null)"></div>
      <aside class="detail-panel" aria-label="Detalle de reporte">
        <div class="drawer-header">
          <div>
            <p class="eyebrow">Detalle de Reporte</p>
            <h2>{{ report.title }}</h2>
          </div>
          <button class="icon-button" (click)="detail.set(null)">Cerrar</button>
        </div>

        <dl class="detail-list">
          <dt>Descripción</dt>
          <dd>{{ report.description }}</dd>

          <dt>Categoría</dt>
          <dd>{{ report.categoryName || report.categoryCode || report.categoryId }}</dd>

          <dt>Prioridad</dt>
          <dd>
            <span class="priority" [class]="'priority-' + report.priority.toLowerCase()">
              {{ priorityLabel(report.priority) }}
            </span>
          </dd>

          <dt>Estado</dt>
          <dd><app-status-badge [status]="report.status" /></dd>

          <dt>Técnico</dt>
          <dd>{{ report.technicianName || 'Sin asignar' }}</dd>

          <dt>Creado</dt>
          <dd>{{ report.createdAt | date:'dd/MM/yyyy HH:mm' }}</dd>

          <dt>Actualizado</dt>
          <dd>{{ report.updatedAt | date:'dd/MM/yyyy HH:mm' }}</dd>
        </dl>
      </aside>
    }

    @if (toast()) {
      <div class="toast" role="status">{{ toast() }}</div>
    }
  `
})
export class UserReportsComponent {
  private readonly service = inject(ReportService);
  categories: Category[] = [];
  reports = signal<Report[]>([]);
  loading = true;
  sending = signal(false);
  drawer = signal(false);
  detail = signal<Report | null>(null);
  toast = signal('');
  error = '';

  search = signal('');
  priority = signal('');
  category = signal('');
  statusFilter = signal<ReportStatus | ''>('');

  readonly filteredReports = computed(() =>
    this.reports().filter(report =>
      (!this.search() || report.title.toLowerCase().includes(this.search().toLowerCase())) &&
      (!this.priority() || report.priority === this.priority()) &&
      (!this.category() || report.categoryId === this.category()) &&
      (!this.statusFilter() || report.status === this.statusFilter())
    )
  );

  readonly cards = computed(() => [
    { status: '' as const, label: 'Total', count: this.reports().length },
    { status: 'OPEN' as const, label: 'Abiertos', count: this.reports().filter(r => r.status === 'OPEN').length },
    { status: 'IN_PROGRESS' as const, label: 'En proceso', count: this.reports().filter(r => r.status === 'IN_PROGRESS').length },
    { status: 'RESOLVED' as const, label: 'Resueltos', count: this.reports().filter(r => r.status === 'RESOLVED').length }
  ]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.service.categories().subscribe({ next: r => this.categories = r.items });
    this.service.reports().subscribe({
      next: r => this.reports.set(r.items),
      error: e => this.setError(e),
      complete: () => this.loading = false
    });
  }

  toggleStatus(status: ReportStatus | ''): void {
    this.statusFilter.set(this.statusFilter() === status ? '' : status);
  }

  create(payload: CreateReportRequest): void {
    this.sending.set(true);
    this.service.create(payload).subscribe({
      next: () => {
        this.sending.set(false);
        this.drawer.set(false);
        this.toast.set('Reporte creado correctamente.');
        this.load();
        setTimeout(() => this.toast.set(''), 3000);
      },
      error: e => {
        this.sending.set(false);
        this.setError(e);
      }
    });
  }

  priorityLabel(priority: ReportPriority): string {
    return { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' }[priority];
  }

  private setError(error: HttpErrorResponse): void {
    this.error = error.error?.error?.message ?? 'No fue posible completar la operación.';
    this.loading = false;
  }
}
