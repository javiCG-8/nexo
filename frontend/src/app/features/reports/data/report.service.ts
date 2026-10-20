import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CategoryListResponse } from '../../../core/models/category.model';
import { CreateReportRequest, Report, ReportListResponse, ReportStatus } from '../../../core/models/report.model';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  categories() {
    return this.http.get<CategoryListResponse>(`${this.baseUrl}/categories`);
  }

  reports() {
    return this.http.get<ReportListResponse>(`${this.baseUrl}/reports`);
  }

  create(payload: CreateReportRequest) {
    return this.http.post<Report>(`${this.baseUrl}/reports`, payload);
  }

  update(reportId: string, payload: Partial<CreateReportRequest>) {
    return this.http.put<Report>(`${this.baseUrl}/reports/${reportId}`, payload);
  }

  cancel(reportId: string) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/reports/${reportId}`);
  }

  assign(reportId: string) {
    return this.http.patch<Report>(`${this.baseUrl}/reports/${reportId}/assignment`, { assignToMe: true });
  }

  updateStatus(reportId: string, status: ReportStatus, resolutionNotes?: string) {
    return this.http.patch<Report>(`${this.baseUrl}/reports/${reportId}/status`, { status, resolutionNotes });
  }
}
