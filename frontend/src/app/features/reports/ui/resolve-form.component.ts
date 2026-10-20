import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { Report } from '../../../core/models/report.model';
import { IconComponent } from '../../../shared/ui/icon.component';

const MIN = 5;
const MAX = 2000;

/** Notas de solución obligatorias al resolver (spec 002, FR-004). */
@Component({
  selector: 'app-resolve-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <p class="lead">Cuéntale a <strong>{{ reporter() }}</strong> qué hiciste. Quedará en el historial del reporte.</p>
    <div class="field">
      <label class="field-label" for="resolve-notes">
        Solución aplicada <span class="count" aria-hidden="true">{{ notes().trim().length }}/{{ max }}</span>
      </label>
      <textarea id="resolve-notes" class="input" rows="5" [attr.maxlength]="max" [value]="notes()"
        (input)="notes.set($any($event.target).value)" (blur)="touched.set(true)"
        placeholder="Ej.: Se reemplazó el conector RJ-45 y se verificó la conexión con el servidor."
        [attr.aria-invalid]="showError()" aria-describedby="resolve-error"></textarea>
      @if (showError()) {
        <p class="field-error" id="resolve-error"><app-icon name="alert" [size]="14" /> Describe la solución con al menos {{ min }} caracteres.</p>
      }
    </div>
    <div class="footer">
      <button type="button" class="btn btn-lg" (click)="dismissed.emit()">Volver</button>
      <button type="button" class="btn btn-primary btn-lg" [disabled]="submitting()" (click)="submit()">
        @if (submitting()) {
          <span class="spinner" aria-hidden="true"></span> Guardando…
        } @else {
          <app-icon name="check" /> Resolver reporte
        }
      </button>
    </div>
  `,
  styles: `
    .lead { color: var(--text-2); margin-bottom: 16px; }
    .count { font-family: var(--font-mono); font-size: 11.5px; font-weight: 500; color: var(--text-3); }
    .footer { display: grid; grid-template-columns: auto 1fr; gap: 10px; margin-top: 24px; }
  `
})
export class ResolveFormComponent {
  readonly report = input.required<Report>();
  readonly submitting = input(false);
  readonly resolved = output<string>();
  readonly dismissed = output<void>();

  protected readonly min = MIN;
  protected readonly max = MAX;
  protected readonly notes = signal('');
  protected readonly touched = signal(false);
  protected readonly reporter = computed(() => this.report().reporterName.replace(/\s*\(.*?\)/, '') || 'quien reportó');
  protected readonly showError = computed(() => this.touched() && this.notes().trim().length < MIN);

  constructor() {
    effect(() => {
      this.report();
      this.notes.set('');
      this.touched.set(false);
    });
  }

  protected submit(): void {
    this.touched.set(true);
    const value = this.notes().trim();
    if (value.length >= MIN && !this.submitting()) this.resolved.emit(value);
  }
}
