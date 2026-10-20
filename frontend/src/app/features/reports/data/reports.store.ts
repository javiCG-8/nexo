import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Category } from '../../../core/models/category.model';
import { Report, ReportPayload, ReportPriority, ReportStatus } from '../../../core/models/report.model';
import { PRIORITY_LEVEL, apiErrorMessage } from '../../../core/utils/report-rules';
import { ReportService } from './report.service';

export type StatusFilter = ReportStatus | 'ALL';
export type SortKey = 'recent' | 'priority' | 'updated';

/**
 * Estado de la pantalla de reportes con señales. Se provee por página
 * (`providers: [ReportsStore]`) para que cada vista tenga su propio estado.
 */
@Injectable()
export class ReportsStore {
  private readonly api = inject(ReportService);

  readonly reports = signal<Report[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  /** Ids con una operación en curso, para deshabilitar sus botones. */
  readonly busy = signal<ReadonlySet<string>>(new Set());

  readonly search = signal('');
  readonly status = signal<StatusFilter>('ALL');
  readonly priority = signal<ReportPriority | ''>('');
  readonly category = signal('');
  readonly sort = signal<SortKey>('recent');
  /** Filtro adicional que define cada página (p. ej. "asignados a mí"). */
  readonly scope = signal<(report: Report) => boolean>(() => true);

  readonly counts = computed(() => {
    const inScope = this.reports().filter(this.scope());
    return {
      ALL: inScope.length,
      OPEN: inScope.filter(r => r.status === 'OPEN').length,
      IN_PROGRESS: inScope.filter(r => r.status === 'IN_PROGRESS').length,
      RESOLVED: inScope.filter(r => r.status === 'RESOLVED').length
    };
  });

  /** Reportes visibles con todos los filtros salvo el de estado (lo usa el tablero). */
  readonly filteredAnyStatus = computed(() => {
    const term = this.search().trim().toLowerCase();
    const scope = this.scope();
    const sorted = this.reports().filter(
      r =>
        scope(r) &&
        (!term || `${r.title} ${r.description} ${r.categoryName}`.toLowerCase().includes(term)) &&
        (!this.priority() || r.priority === this.priority()) &&
        (!this.category() || r.categoryId === this.category())
    );
    const key = this.sort();
    return sorted.sort((a, b) =>
      key === 'priority'
        ? PRIORITY_LEVEL[b.priority] - PRIORITY_LEVEL[a.priority] || b.createdAt.localeCompare(a.createdAt)
        : key === 'updated'
          ? b.updatedAt.localeCompare(a.updatedAt)
          : b.createdAt.localeCompare(a.createdAt)
    );
  });

  readonly filtered = computed(() =>
    this.filteredAnyStatus().filter(r => this.status() === 'ALL' || r.status === this.status())
  );

  readonly hasActiveFilters = computed(
    () => !!this.search().trim() || !!this.priority() || !!this.category() || this.status() !== 'ALL'
  );

  /** `silent` actualiza en segundo plano sin mostrar el esqueleto de carga. */
  load(options: { withCategories?: boolean; silent?: boolean } = {}): void {
    const { withCategories = false, silent = false } = options;
    if (!silent) this.loading.set(true);
    this.error.set('');
    if (withCategories && this.categories().length === 0) {
      this.api.categories().subscribe({ next: items => this.categories.set(items) });
    }
    this.api.list().subscribe({
      next: items => {
        this.reports.set(items);
        this.loading.set(false);
      },
      error: error => {
        if (!silent) this.error.set(apiErrorMessage(error, 'No fue posible cargar los reportes.'));
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.search.set('');
    this.status.set('ALL');
    this.priority.set('');
    this.category.set('');
  }

  create(payload: ReportPayload): Observable<Report> {
    return this.api.create(payload).pipe(tap(report => this.reports.update(list => [report, ...list])));
  }

  update(id: string, payload: Partial<ReportPayload>): Observable<Report> {
    return this.track(id, this.api.update(id, payload)).pipe(tap(report => this.replace(report)));
  }

  cancel(id: string): Observable<unknown> {
    return this.track(id, this.api.cancel(id)).pipe(
      tap(() => this.reports.update(list => list.filter(r => r.id !== id)))
    );
  }

  assign(id: string): Observable<Report> {
    return this.track(id, this.api.assign(id)).pipe(tap(report => this.replace(report)));
  }

  changeStatus(id: string, status: ReportStatus, notes?: string): Observable<Report> {
    return this.track(id, this.api.changeStatus(id, status, notes)).pipe(tap(report => this.replace(report)));
  }

  findById(id: string): Report | undefined {
    return this.reports().find(r => r.id === id);
  }

  private replace(report: Report): void {
    this.reports.update(list => list.map(r => (r.id === report.id ? report : r)));
  }

  private track<T>(id: string, request: Observable<T>): Observable<T> {
    return new Observable<T>(subscriber => {
      this.busy.update(set => new Set(set).add(id));
      const subscription = request.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        this.busy.update(set => {
          const next = new Set(set);
          next.delete(id);
          return next;
        });
      };
    });
  }
}
