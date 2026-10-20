export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Report {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  resolutionNotes: string | null;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  priority: ReportPriority;
  status: ReportStatus;
  reporterId: string;
  reporterName: string;
  technicianId: string | null;
  technicianName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportListResponse {
  items: Report[];
}

export interface ReportPayload {
  title: string;
  description: string;
  categoryId: string;
  priority: ReportPriority;
}
