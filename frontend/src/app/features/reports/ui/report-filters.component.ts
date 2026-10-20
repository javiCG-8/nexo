import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { PRIORITIES, PRIORITY_LABEL } from '../../../core/utils/report-rules';
import { IconComponent } from '../../../shared/ui/icon.component';
import { ReportsStore, StatusFilter } from '../data/reports.store';

/** Segmentos de estado con contadores + búsqueda y filtros secundarios. */
@Component({
  selector: 'app-report-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="segments" role="radiogroup" aria-label="Filtrar por estado">
      @for (segment of segments(); track segment.value) {
        <button type="button" role="radio" class="segment" [attr.aria-checked]="store.status() === segment.value"
          (click)="store.status.set(segment.value)">
          {{ segment.label }} <span class="count">{{ segment.count }}</span>
        </button>
      }
    </div>

    <div class="controls" [class.expanded]="expanded()">
      <div class="search-row">
        <div class="input-icon search">
          <app-icon name="search" [size]="16" />
          <input class="input" type="search" placeholder="Buscar por título, detalle o categoría" aria-label="Buscar reportes"
            [value]="store.search()" (input)="store.search.set($any($event.target).value)" />
        </div>
        <button type="button" class="btn btn-icon toggle" (click)="expanded.update(v => !v)"
          [attr.aria-expanded]="expanded()" aria-controls="more-filters" aria-label="Más filtros">
          <app-icon name="filter" [size]="16" />
          @if (secondaryActive() > 0) {
            <span class="dot" aria-hidden="true">{{ secondaryActive() }}</span>
          }
        </button>
      </div>
      <div class="more" id="more-filters">
      <select class="input" aria-label="Filtrar por prioridad" [value]="store.priority()"
        (change)="store.priority.set($any($event.target).value)">
        <option value="">Toda prioridad</option>
        @for (priority of priorities; track priority) {
          <option [value]="priority">{{ priorityLabel[priority] }}</option>
        }
      </select>
      @if (showCategories()) {
        <select class="input" aria-label="Filtrar por categoría" [value]="store.category()"
          (change)="store.category.set($any($event.target).value)">
          <option value="">Toda categoría</option>
          @for (category of store.categories(); track category.id) {
            <option [value]="category.id">{{ category.name }}</option>
          }
        </select>
      }
      <select class="input" aria-label="Ordenar" [value]="store.sort()" (change)="store.sort.set($any($event.target).value)">
        <option value="recent">Más recientes</option>
        <option value="priority">Mayor prioridad</option>
        <option value="updated">Última actividad</option>
      </select>
      </div>
    </div>
  `,
  styles: `
    :host { display: grid; gap: 12px; }
    .segments {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
      margin: 0 -16px;
      padding: 0 16px;
    }
    .segments::-webkit-scrollbar { display: none; }
    .segment {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex: none;
      min-height: 36px;
      padding: 0 14px;
      border-radius: var(--r-full);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-2);
      font-size: 13.5px;
      font-weight: 550;
      transition: all var(--dur) var(--ease);
    }
    .segment:hover { border-color: var(--border-strong); color: var(--text); }
    .segment[aria-checked='true'] {
      background: var(--text);
      border-color: var(--text);
      color: var(--bg);
    }
    .count {
      font-family: var(--font-mono);
      font-size: 12px;
      opacity: 0.7;
    }
    .controls { display: grid; gap: 8px; }
    .search-row { display: flex; gap: 8px; }
    .search { flex: 1; }
    .toggle { position: relative; min-height: var(--tap); width: var(--tap); }
    .dot {
      position: absolute;
      top: -4px;
      right: -4px;
      display: grid;
      place-items: center;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      background: var(--accent);
      color: var(--on-accent);
      font-size: 11px;
      font-weight: 700;
    }
    .more { display: none; grid-template-columns: 1fr 1fr; gap: 8px; }
    .expanded .more { display: grid; animation: rise 180ms var(--ease); }
    .more select:last-child:nth-child(odd) { grid-column: 1 / -1; }
    @media (min-width: 768px) {
      .segments { margin: 0; padding: 0; }
      .controls { grid-template-columns: minmax(240px, 1fr) auto; }
      .toggle { display: none; }
      .more, .expanded .more { display: flex; animation: none; }
    }
  `
})
export class ReportFiltersComponent {
  protected readonly store = inject(ReportsStore);
  readonly showCategories = input(true);

  protected readonly expanded = signal(false);
  protected readonly secondaryActive = computed(() => Number(!!this.store.priority()) + Number(!!this.store.category()));
  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabel = PRIORITY_LABEL;

  protected readonly segments = computed<{ value: StatusFilter; label: string; count: number }[]>(() => {
    const counts = this.store.counts();
    return [
      { value: 'ALL', label: 'Todos', count: counts.ALL },
      { value: 'OPEN', label: 'Abiertos', count: counts.OPEN },
      { value: 'IN_PROGRESS', label: 'En proceso', count: counts.IN_PROGRESS },
      { value: 'RESOLVED', label: 'Resueltos', count: counts.RESOLVED }
    ];
  });
}
