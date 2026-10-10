export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Report {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryCode?: string;
  categoryName?: string;
  priority: ReportPriority;
  status: ReportStatus;
  reporterId: string;
  technicianId: string | null;
  technicianName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListResponse {
  items: Report[];
}

export interface CreateReportRequest {
  title: string;
  description: string;
  categoryId: string;
  priority: ReportPriority;
}
