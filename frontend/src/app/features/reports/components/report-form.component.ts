import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../core/models/category.model';
import { CreateReportRequest, ReportPriority } from '../../../core/models/report.model';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="drawer-backdrop" [class.visible]="open()" (click)="close.emit()"></div>

    <aside class="drawer" [class.open]="open()" aria-label="Nuevo reporte de incidente">
      <div class="drawer-header">
        <div>
          <p class="eyebrow">Formulario de Soporte</p>
          <h2>Nuevo reporte</h2>
        </div>
        <button type="button" class="icon-button" (click)="close.emit()" aria-label="Cerrar">
          ✕ Cerrar
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label for="title">Título del incidente</label>
        <input
          id="title"
          formControlName="title"
          placeholder="Ej: Falla de conexión a la red cableada en laboratorio 2"
          maxlength="150"
        />
        @if (form.controls.title.invalid && form.controls.title.touched) {
          <small class="field-error">El título del reporte es obligatorio (máx. 150 caracteres).</small>
        }

        <label for="description">Descripción detallada</label>
        <textarea
          id="description"
          formControlName="description"
          rows="5"
          placeholder="Describe los síntomas del problema, mensajes de error u observaciones relevantes..."
          maxlength="5000"
        ></textarea>
        @if (form.controls.description.invalid && form.controls.description.touched) {
          <small class="field-error">La descripción es obligatoria.</small>
        }

        <div class="form-grid">
          <div>
            <label for="categoryId">Categoría</label>
            <select id="categoryId" formControlName="categoryId">
              <option value="">Selecciona una categoría</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
            @if (form.controls.categoryId.invalid && form.controls.categoryId.touched) {
              <small class="field-error">Selecciona una categoría válida.</small>
            }
          </div>

          <div>
            <label for="priority">Prioridad</label>
            <select id="priority" formControlName="priority">
              <option value="LOW">Baja (Sin impacto urgente)</option>
              <option value="MEDIUM">Media (Impacto moderado)</option>
              <option value="HIGH">Alta (Impacto importante)</option>
              <option value="CRITICAL">Crítica (Bloqueo total)</option>
            </select>
          </div>
        </div>

        <button
          class="button button-primary button-wide"
          type="submit"
          [disabled]="submitting()"
        >
          {{ submitting() ? 'Registrando reporte...' : 'Guardar y Enviar Reporte' }}
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
  created = output<CreateReportRequest>();
  close = output<void>();

  private readonly resetOnClose = effect(() => {
    if (!this.open()) this.reset();
  });

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    categoryId: ['', Validators.required],
    priority: ['MEDIUM' as ReportPriority, Validators.required]
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.valid && !this.submitting()) {
      this.created.emit(this.form.getRawValue());
    }
  }

  reset(): void {
    this.form.reset({ title: '', description: '', categoryId: '', priority: 'MEDIUM' });
  }
}
