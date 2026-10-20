import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { CreateReportRequest, Report, ReportPriority } from '../../../core/models/report.model';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="drawer-backdrop" [class.visible]="open()" (click)="close.emit()"></div>

    <aside class="drawer" [class.open]="open()" aria-label="Formulario de reporte">
      <div class="drawer-header">
        <div>
          <p class="eyebrow">Formulario de Soporte</p>
          <h2>{{ editReport() ? 'Editar reporte' : 'Nuevo reporte' }}</h2>
        </div>
        <button type="button" class="icon-button" (click)="close.emit()" aria-label="Cerrar">
          Cerrar
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label for="title">Título del incidente</label>
        <input
          id="title"
          formControlName="title"
          placeholder="Ej: Falla de conexión en laboratorio 2"
          maxlength="150"
        />
        @if (form.controls.title.invalid && form.controls.title.touched) {
          <small class="field-error">El título debe tener entre 3 y 150 caracteres.</small>
        }

        <label for="description">Descripción detallada</label>
        <textarea
          id="description"
          formControlName="description"
          rows="5"
          placeholder="Describe el problema..."
          maxlength="5000"
        ></textarea>
        @if (form.controls.description.invalid && form.controls.description.touched) {
          <small class="field-error">La descripción debe tener al menos 10 caracteres.</small>
        }

        <div class="form-grid">
          <div>
            <label for="categoryId">Categoría</label>
            <select id="categoryId" formControlName="categoryId">
              <option value="">Selecciona categoría</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
            @if (form.controls.categoryId.invalid && form.controls.categoryId.touched) {
              <small class="field-error">Selecciona una categoría.</small>
            }
          </div>

          <div>
            <label for="priority">Prioridad</label>
            <select id="priority" formControlName="priority">
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>
        </div>

        <button
          class="button button-primary button-wide"
          type="submit"
          [disabled]="submitting()"
        >
          {{ submitting() ? 'Guardando...' : (editReport() ? 'Guardar Cambios' : 'Crear Reporte') }}
        </button>
      </form>
    </aside>
  `
})
export class ReportFormComponent {
  private readonly fb = inject(FormBuilder);
  categories = input<Category[]>([]);
  open = input(false);
  submitting = input(false);
  editReport = input<Report | null>(null);
  created = output<CreateReportRequest>();
  updated = output<{ id: string; data: Partial<CreateReportRequest> }>();
  close = output<void>();

  private readonly syncEditForm = effect(() => {
    const report = this.editReport();
    if (report && this.open()) {
      this.form.patchValue({
        title: report.title,
        description: report.description,
        categoryId: report.categoryId,
        priority: report.priority
      });
    } else if (!this.open()) {
      this.reset();
    }
  });

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    categoryId: ['', Validators.required],
    priority: ['MEDIUM' as ReportPriority, Validators.required]
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid && !this.submitting()) {
      const edit = this.editReport();
      if (edit) {
        this.updated.emit({ id: edit.id, data: this.form.getRawValue() });
      } else {
        this.created.emit(this.form.getRawValue());
      }
    }
  }

  reset(): void {
    this.form.reset({ title: '', description: '', categoryId: '', priority: 'MEDIUM' });
  }
}
