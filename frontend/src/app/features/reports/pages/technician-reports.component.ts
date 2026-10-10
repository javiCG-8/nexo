import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/components/navbar.component';
import { MensajeErrorComponent } from '../../../shared/components/mensaje-error.component';
import { IndicadorCargaComponent } from '../../../shared/components/indicador-carga.component';
import { Report, ReportPriority, ReportStatus } from '../../../core/models/report.model';
import { ReportService } from '../services/report.service';
import { ReportTableComponent } from '../components/report-table.component';
import { StatusBadgeComponent } from '../components/status-badge.component';

@Component({
  selector: 'app-technician-reports',
  standalone: true,
  imports: [
    DatePipe,
    NavbarComponent,
    MensajeErrorComponent,
    IndicadorCargaComponent,
    ReportTableComponent,
    StatusBadgeComponent
  ],
  template: `
    <app-navbar />

    <main class="workspace">
      <header class="page-heading">
        <div>
          <p class="eyebrow">Panel Técnico</p>
          <h1>Gestión de Reportes</h1>
        </div>
        <div class="view-toggle">
          <button [class.active]="view() === 'table'" (click)="view.set('table')">Tabla</button>
          <button [class.active]="view() === 'board'" (click)="view.set('board')">Tablero</button>
        </div>
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
            <label for="search-tech">Buscar</label>
            <input
              id="search-tech"
              placeholder="Buscar por título..."
              (input)="search.set($any($event.target).value)"
            />
          </div>

          <div>
            <label for="priority-tech">Prioridad</label>
            <select id="priority-tech" (change)="priority.set($any($event.target).value)">
              <option value="">Todas</option>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>

          <button class="button button-secondary toolbar-action" (click)="load()">
            Actualizar
          </button>
        </div>

        @if (loading) {
          <app-indicador-carga message="Cargando reportes..." />
        } @else if (view() === 'table') {
          <app-report-table
            [reports]="filteredReports()"
            [technicianMode]="true"
            (selected)="detail.set($event)"
            (assign)="assign($event)"
            (advance)="advance($event.report, $event.status)"
          />
        } @else {
          <div class="board">
            @for (column of columns; track column.status) {
              <section class="board-column">
                <h2>
                  {{ column.label }}
                  <span>{{ byStatus(column.status).length }}</span>
                </h2>

                @for (report of byStatus(column.status); track report.id) {
                  <article class="board-card" (click)="detail.set(report)">
                    <strong>{{ report.title }}</strong>
                    <small>{{ report.categoryName || report.categoryCode || 'General' }}</small>
                    <div>
                      <app-status-badge [status]="report.status" />
                      <span class="priority" [class]="'priority-' + report.priority.toLowerCase()">
                        {{ priorityLabel(report.priority) }}
                      </span>
                    </div>

                    <div class="board-actions">
                      @if (!report.technicianId) {
                        <button
                          class="button button-small"
                          (click)="assign(report); $event.stopPropagation()"
                        >
                          Asignarme
                        </button>
                      }
                      @if (report.technicianId && nextStatus(report.status); as next) {
                        <button
                          class="button button-small"
                          (click)="advance(report, next); $event.stopPropagation()"
                        >
                          {{ next === 'IN_PROGRESS' ? 'En proceso' : 'Resolver' }}
                        </button>
                      }
                    </div>
                  </article>
                } @empty {
                  <p class="empty-state">Sin reportes.</p>
                }
              </section>
            }
          </div>
        }
      </section>
    </main>

    @if (detail(); as report) {
      <div class="detail-backdrop" (click)="detail.set(null)"></div>
      <aside class="detail-panel" aria-label="Detalle del reporte">
        <div class="drawer-header">
          <div>
            <p class="eyebrow">Detalle del Reporte</p>
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
export class TechnicianReportsComponent {
  private readonly service = inject(ReportService);
  reports = signal<Report[]>([]);
  loading = true;
  error = '';
  view = signal<'table' | 'board'>('table');
  detail = signal<Report | null>(null);
  toast = signal('');

  search = signal('');
  priority = signal('');
  statusFilter = signal<ReportStatus | ''>('');

  readonly columns = [
    { status: 'OPEN' as const, label: 'Abierto' },
    { status: 'IN_PROGRESS' as const, label: 'En proceso' },
    { status: 'RESOLVED' as const, label: 'Resuelto' }
  ];

  readonly filteredReports = computed(() =>
    this.reports().filter(r =>
      (!this.search() || r.title.toLowerCase().includes(this.search().toLowerCase())) &&
      (!this.priority() || r.priority === this.priority()) &&
      (!this.statusFilter() || r.status === this.statusFilter())
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
    this.service.reports().subscribe({
      next: r => this.reports.set(r.items),
      error: e => this.setError(e),
      complete: () => this.loading = false
    });
  }

  byStatus(status: ReportStatus): Report[] {
    return this.filteredReports().filter(r => r.status === status);
  }

  toggleStatus(status: ReportStatus | ''): void {
    this.statusFilter.set(this.statusFilter() === status ? '' : status);
  }

  assign(report: Report): void {
    this.service.assign(report.id).subscribe({
      next: () => this.updated('Reporte asignado.'),
      error: e => this.setError(e)
    });
  }

  advance(report: Report, status: ReportStatus): void {
    this.service.updateStatus(report.id, status).subscribe({
      next: () => this.updated('Estado actualizado.'),
      error: e => this.setError(e)
    });
  }

  nextStatus(status: ReportStatus): ReportStatus | null {
    return status === 'OPEN' ? 'IN_PROGRESS' : status === 'IN_PROGRESS' ? 'RESOLVED' : null;
  }

  priorityLabel(priority: ReportPriority): string {
    return { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' }[priority];
  }

  private updated(message: string): void {
    this.toast.set(message);
    this.load();
    setTimeout(() => this.toast.set(''), 3000);
  }

  private setError(error: HttpErrorResponse): void {
    this.error = error.error?.error?.message ?? 'No fue posible completar la operación.';
    this.loading = false;
  }
}
