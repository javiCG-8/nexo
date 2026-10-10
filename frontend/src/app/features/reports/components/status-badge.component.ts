import { Component, input } from '@angular/core';
import { ReportStatus } from '../../../core/models/report.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span class="status-badge" [class]="'status-' + status().toLowerCase()">{{ label() }}</span>`
})
export class StatusBadgeComponent {
  status = input.required<ReportStatus>();

  label(): string {
    return {
      OPEN: 'Abierto',
      IN_PROGRESS: 'En proceso',
      RESOLVED: 'Resuelto'
    }[this.status()];
  }
}
