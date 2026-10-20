import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Report } from '../../../core/models/report.model';
import { ReportService } from './report.service';
import { ReportsStore } from './reports.store';

const base: Report = {
  id: 'r-0', organizationId: 'o', title: '', description: '', resolutionNotes: null, categoryId: 'c-net',
  categoryCode: 'NETWORK', categoryName: 'Redes', priority: 'LOW', status: 'OPEN', reporterId: 'u', reporterName: 'U',
  technicianId: null, technicianName: null, createdAt: '2026-10-20T10:00:00Z', updatedAt: '2026-10-20T10:00:00Z'
};

const reports: Report[] = [
  { ...base, id: 'r-1', title: 'Sin WiFi', priority: 'HIGH', createdAt: '2026-10-20T09:00:00Z' },
  { ...base, id: 'r-2', title: 'Impresora', categoryId: 'c-print', priority: 'CRITICAL', status: 'IN_PROGRESS', technicianId: 't' },
  { ...base, id: 'r-3', title: 'Monitor', status: 'RESOLVED', createdAt: '2026-10-20T11:00:00Z' }
];

describe('ReportsStore', () => {
  let store: ReportsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportsStore,
        { provide: ReportService, useValue: { list: () => of(reports), categories: () => of([]) } }
      ]
    });
    store = TestBed.inject(ReportsStore);
    store.load();
  });

  it('carga los reportes y cuenta por estado', () => {
    expect(store.loading()).toBe(false);
    expect(store.counts()).toEqual({ ALL: 3, OPEN: 1, IN_PROGRESS: 1, RESOLVED: 1 });
  });

  it('combina búsqueda, estado y categoría', () => {
    store.search.set('wifi');
    expect(store.filtered().map(r => r.id)).toEqual(['r-1']);

    store.search.set('');
    store.status.set('IN_PROGRESS');
    expect(store.filtered().map(r => r.id)).toEqual(['r-2']);

    store.status.set('ALL');
    store.category.set('c-net');
    expect(store.filtered().map(r => r.id)).toEqual(['r-3', 'r-1']);
    expect(store.hasActiveFilters()).toBe(true);
  });

  it('ordena por prioridad cuando se solicita', () => {
    store.sort.set('priority');
    expect(store.filtered().map(r => r.priority)).toEqual(['CRITICAL', 'HIGH', 'LOW']);
  });

  it('aplica el alcance de la página a los contadores', () => {
    store.scope.set(r => !r.technicianId);
    expect(store.counts().ALL).toBe(2);
  });
});
