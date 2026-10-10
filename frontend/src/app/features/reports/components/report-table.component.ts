import { Component, computed, input, output, signal } from '@angular/core';
import { Report, ReportPriority, ReportStatus } from '../../../core/models/report.model';
import { StatusBadgeComponent } from './status-badge.component';

type SortKey = 'title' | 'priority' | 'status' | 'updatedAt';

@Component({
  selector: 'app-report-table',
  standalone: true,
  imports: [StatusBadgeComponent],
  template: `
    @if (reports().length === 0) {
      <div class="empty-state">
        <svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin: 0 auto 12px; display: block; color: var(--muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p style="margin:0; font-weight: 500;">No se encontraron reportes con los criterios de búsqueda seleccionados.</p>
      </div>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <button class="sort-button" (click)="sort('title')">
                  Reporte {{ arrow('title') }}
                </button>
              </th>
              <th>Categoría</th>
              <th>
                <button class="sort-button" (click)="sort('priority')">
                  Prioridad {{ arrow('priority') }}
                </button>
              </th>
              <th>
                <button class="sort-button" (click)="sort('status')">
                  Estado {{ arrow('status') }}
                </button>
              </th>
              <th>Técnico Asignado</th>
              <th>
                <button class="sort-button" (click)="sort('updatedAt')">
                  Última Act. {{ arrow('updatedAt') }}
                </button>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (report of paged(); track report.id) {
              <tr class="report-row" (click)="selected.emit(report)">
                <td>
                  <strong>{{ report.title }}</strong>
                  <small>{{ report.description }}</small>
                </td>
                <td>{{ report.categoryName || report.categoryCode || report.categoryId }}</td>
                <td>
                  <span class="priority" [class]="'priority-' + report.priority.toLowerCase()">
                    {{ priorityLabel(report.priority) }}
                  </span>
                </td>
                <td><app-status-badge [status]="report.status" /></td>
                <td>{{ report.technicianName || 'Sin asignar' }}</td>
                <td>
                  <time [attr.title]="fullDate(report.updatedAt)">
                    {{ relativeDate(report.updatedAt) }}
                  </time>
                </td>
                <td class="actions" (click)="$event.stopPropagation()">
                  @if (technicianMode() && !report.technicianId) {
                    <button class="button button-small button-primary" (click)="assign.emit(report)">
                      Asignarme
                    </button>
                  }
                  @if (technicianMode() && report.technicianId && nextStatus(report.status); as next) {
                    <button class="button button-small" (click)="advance.emit({ report, status: next })">
                      {{ next === 'IN_PROGRESS' ? 'En proceso' : 'Resolver' }}
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (pageCount() > 1) {
        <div class="pagination">
          <span>Mostrando {{ start() + 1 }}–{{ end() }} de {{ filtered().length }} reportes</span>
          <div>
            <button
              class="button button-small"
              (click)="page.update(p => p - 1)"
              [disabled]="page() === 0"
            >
              Anterior
            </button>
            <button
              class="button button-small"
              (click)="page.update(p => p + 1)"
              [disabled]="page() >= pageCount() - 1"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    }
  `
})
export class ReportTableComponent {
  reports = input<Report[]>([]);
  technicianMode = input(false);
  selected = output<Report>();
  assign = output<Report>();
  advance = output<{ report: Report; status: ReportStatus }>();

  private sortKey = signal<SortKey>('updatedAt');
  private direction = signal<'asc' | 'desc'>('desc');
  readonly page = signal(0);

  readonly filtered = computed(() => [...this.reports()].sort((a, b) => this.compare(a, b)));
  readonly paged = computed(() => this.filtered().slice(this.start(), this.start() + 10));
  readonly pageCount = computed(() => Math.ceil(this.filtered().length / 10));
  readonly start = computed(() => Math.min(this.page() * 10, Math.max(0, (this.pageCount() - 1) * 10)));
  readonly end = computed(() => Math.min(this.start() + 10, this.filtered().length));

  sort(key: SortKey): void {
    this.direction.set(this.sortKey() === key && this.direction() === 'asc' ? 'desc' : 'asc');
    this.sortKey.set(key);
    this.page.set(0);
  }

  arrow(key: SortKey): string {
    return this.sortKey() === key ? (this.direction() === 'asc' ? '↑' : '↓') : '';
  }

  nextStatus(status: ReportStatus): ReportStatus | null {
    return status === 'OPEN' ? 'IN_PROGRESS' : status === 'IN_PROGRESS' ? 'RESOLVED' : null;
  }

  priorityLabel(priority: ReportPriority): string {
    return { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' }[priority];
  }

  fullDate(value: string): string {
    return new Date(value).toLocaleString('es-EC');
  }

  relativeDate(value: string): string {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours} h`;
    return `hace ${Math.floor(hours / 24)} d`;
  }

  private compare(a: Report, b: Report): number {
    const key = this.sortKey();
    const left = key === 'title' ? a.title : key === 'priority' ? a.priority : key === 'status' ? a.status : a.updatedAt;
    const right = key === 'title' ? b.title : key === 'priority' ? b.priority : key === 'status' ? b.status : b.updatedAt;
    const result = String(left).localeCompare(String(right), 'es', { numeric: true });
    return this.direction() === 'asc' ? result : -result;
  }
}
