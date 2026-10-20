import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Category, CategoryListResponse } from '../../../core/models/category.model';
import { Report, ReportListResponse, ReportPayload, ReportStatus } from '../../../core/models/report.model';

/** Cliente HTTP de la API de reportes. Sin estado: el estado vive en ReportsStore. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  categories() {
    return this.http.get<CategoryListResponse>(`${this.baseUrl}/categories`).pipe(map(r => r.items as Category[]));
  }

  list() {
    return this.http.get<ReportListResponse>(`${this.baseUrl}/reports`).pipe(map(r => r.items));
  }

  create(payload: ReportPayload) {
    return this.http.post<Report>(`${this.baseUrl}/reports`, payload);
  }

  update(id: string, payload: Partial<ReportPayload>) {
    return this.http.put<Report>(`${this.baseUrl}/reports/${encodeURIComponent(id)}`, payload);
  }

  cancel(id: string) {
    return this.http.delete<{ id: string }>(`${this.baseUrl}/reports/${encodeURIComponent(id)}`);
  }

  assign(id: string) {
    return this.http.patch<Report>(`${this.baseUrl}/reports/${encodeURIComponent(id)}/assignment`, { assignToMe: true });
  }

  changeStatus(id: string, status: ReportStatus, resolutionNotes?: string) {
    return this.http.patch<Report>(`${this.baseUrl}/reports/${encodeURIComponent(id)}/status`, {
      status,
      ...(resolutionNotes ? { resolutionNotes } : {})
    });
  }
}
