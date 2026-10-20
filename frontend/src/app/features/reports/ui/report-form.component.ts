import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { Report, ReportPayload, ReportPriority } from '../../../core/models/report.model';
import { PRIORITIES, PRIORITY_HINT, PRIORITY_LABEL } from '../../../core/utils/report-rules';
import { IconComponent } from '../../../shared/ui/icon.component';
import { PriorityComponent } from '../../../shared/ui/report-badges.component';

export const TITLE_MAX = 150;
export const DESCRIPTION_MAX = 5000;

/** Formulario de creación y edición. Las reglas coinciden con los esquemas de la API. */
@Component({
  selector: 'app-report-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IconComponent, PriorityComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="field">
        <label class="field-label" for="rf-title">
          ¿Qué está pasando?
          <span class="count" aria-hidden="true">{{ titleLength() }}/{{ titleMax }}</span>
        </label>
        <input id="rf-title" class="input" formControlName="title" [maxlength]="titleMax"
          placeholder="Ej.: No hay internet en el laboratorio 2"
          [attr.aria-invalid]="invalid('title')" aria-describedby="rf-title-error" />
        @if (invalid('title')) {
          <p class="field-error" id="rf-title-error"><app-icon name="alert" [size]="14" /> Escribe un título de 3 a 150 caracteres.</p>
        }
      </div>

      <div class="field">
        <label class="field-label" for="rf-description">
          Detalles
          <span class="count" aria-hidden="true">{{ descriptionLength() }}/{{ descriptionMax }}</span>
        </label>
        <textarea id="rf-description" class="input" formControlName="description" rows="5" [maxlength]="descriptionMax"
          placeholder="¿Desde cuándo ocurre? ¿Qué equipo o lugar? ¿Qué intentaste?"
          [attr.aria-invalid]="invalid('description')" aria-describedby="rf-description-hint rf-description-error"></textarea>
        @if (invalid('description')) {
          <p class="field-error" id="rf-description-error"><app-icon name="alert" [size]="14" /> Describe el problema con al menos 10 caracteres.</p>
        } @else {
          <p class="field-hint" id="rf-description-hint">Mientras más contexto, más rápido se resuelve.</p>
        }
      </div>

      <div class="field">
        <label class="field-label" for="rf-category">Categoría</label>
        <select id="rf-category" class="input" formControlName="categoryId" [attr.aria-invalid]="invalid('categoryId')"
          aria-describedby="rf-category-error">
          <option value="" disabled>Selecciona una categoría</option>
          @for (category of categories(); track category.id) {
            <option [value]="category.id">{{ category.name }}</option>
          }
        </select>
        @if (invalid('categoryId')) {
          <p class="field-error" id="rf-category-error"><app-icon name="alert" [size]="14" /> Elige la categoría que mejor describe el problema.</p>
        }
      </div>

      <fieldset class="field priorities">
        <legend class="field-label">Impacto</legend>
        <div class="priority-grid">
          @for (priority of priorities; track priority) {
            <label class="priority-option" [class.selected]="form.controls.priority.value === priority">
              <input type="radio" class="sr-only" formControlName="priority" [value]="priority" />
              <app-priority [priority]="priority" [showLabel]="false" aria-hidden="true" />
              <span>
                <strong>{{ priorityLabel[priority] }}</strong>
                <small>{{ priorityHint[priority] }}</small>
              </span>
            </label>
          }
        </div>
      </fieldset>

      <div class="footer">
        <button type="button" class="btn btn-lg" (click)="dismissed.emit()">Descartar</button>
        <button type="submit" class="btn btn-primary btn-lg" [disabled]="submitting()">
          @if (submitting()) {
            <span class="spinner" aria-hidden="true"></span> Guardando…
          } @else {
            <app-icon [name]="report() ? 'check' : 'plus'" /> {{ report() ? 'Guardar cambios' : 'Enviar reporte' }}
          }
        </button>
      </div>
    </form>
  `,
  styles: `
    form { display: grid; }
    .count { font-family: var(--font-mono); font-size: 11.5px; font-weight: 500; color: var(--text-3); }
    .priorities { border: 0; padding: 0; margin: 16px 0 0; min-width: 0; }
    .priorities legend { padding: 0; margin-bottom: 6px; }
    .priority-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .priority-option {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      min-height: 64px;
      padding: 12px;
      border: 1px solid var(--border-strong);
      border-radius: var(--r-md);
      cursor: pointer;
      transition: border-color var(--dur) var(--ease), background var(--dur) var(--ease);
    }
    .priority-option app-priority { margin-top: 3px; }
    .priority-option:hover { border-color: var(--text-3); }
    .priority-option.selected {
      border-color: var(--accent);
      background: var(--accent-soft);
      box-shadow: inset 0 0 0 1px var(--accent);
    }
    .priority-option:has(input:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
    .priority-option span { display: grid; line-height: 1.3; }
    .priority-option strong { font-size: 14px; }
    .priority-option small { font-size: 12px; color: var(--text-3); }
    .footer {
      position: sticky;
      bottom: -24px;
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      margin: 24px -20px -24px;
      padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
      background: var(--surface);
      border-top: 1px solid var(--border);
    }
  `
})
export class ReportFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly categories = input<Category[]>([]);
  readonly report = input<Report | null>(null);
  readonly submitting = input(false);
  readonly saved = output<ReportPayload>();
  readonly dismissed = output<void>();

  protected readonly titleMax = TITLE_MAX;
  protected readonly descriptionMax = DESCRIPTION_MAX;
  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabel = PRIORITY_LABEL;
  protected readonly priorityHint = PRIORITY_HINT;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(TITLE_MAX)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(DESCRIPTION_MAX)]],
    categoryId: ['', Validators.required],
    priority: ['MEDIUM' as ReportPriority, Validators.required]
  });

  private readonly values = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  protected readonly titleLength = computed(() => (this.values().title ?? '').length);
  protected readonly descriptionLength = computed(() => (this.values().description ?? '').length);

  constructor() {
    // Carga los datos al editar o deja el formulario limpio al crear.
    effect(() => {
      const report = this.report();
      this.form.reset(
        report
          ? { title: report.title, description: report.description, categoryId: report.categoryId, priority: report.priority }
          : { title: '', description: '', categoryId: '', priority: 'MEDIUM' }
      );
    });
  }

  protected invalid(control: keyof typeof this.form.controls): boolean {
    const field = this.form.controls[control];
    return field.invalid && field.touched;
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;
    const value = this.form.getRawValue();
    this.saved.emit({ ...value, title: value.title.trim(), description: value.description.trim() });
  }
}
