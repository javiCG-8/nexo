import { query } from '../db/pool';
import { Priority, Role, Status } from '../shared/types';

/** Ventana durante la cual el usuario puede editar o cancelar su reporte (spec 002). */
export const EDIT_WINDOW_MINUTES = 5;

/** Condición SQL reutilizable: el reporte aún puede ser modificado por su autor. */
const editableByReporter = `status = 'OPEN' AND technician_id IS NULL
       AND created_at >= now() - make_interval(mins => ${EDIT_WINDOW_MINUTES})`;

export const reportSelect = `
  SELECT r.id, r.organization_id AS "organizationId", r.title, r.description,
         r.resolution_notes AS "resolutionNotes",
         r.category_id AS "categoryId", c.code AS "categoryCode", c.name AS "categoryName",
         r.priority, r.status, r.reporter_id AS "reporterId", u.name AS "reporterName",
         r.technician_id AS "technicianId", t.name AS "technicianName",
         r.created_at AS "createdAt", r.updated_at AS "updatedAt"
  FROM reports r
  JOIN categories c ON c.id = r.category_id AND c.organization_id = r.organization_id
  JOIN users u ON u.id = r.reporter_id AND u.organization_id = r.organization_id
  LEFT JOIN users t ON t.id = r.technician_id AND t.organization_id = r.organization_id`;

export interface ReportFilters {
  status?: Status;
  priority?: Priority;
  categoryId?: string;
  technicianId?: string;
}

export interface ReportChanges {
  title?: string;
  description?: string;
  categoryId?: string;
  priority?: Priority;
}

export function createReport(
  organizationId: string,
  reporterId: string,
  title: string,
  description: string,
  categoryId: string,
  priority: Priority
) {
  return query<{ id: string }>(
    `INSERT INTO reports (organization_id, title, description, category_id, priority, reporter_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [organizationId, title, description, categoryId, priority, reporterId]
  );
}

/** Actualiza solo si el reporte sigue siendo editable; la condición se evalúa de forma atómica. */
export function updateReportByReporter(
  id: string,
  organizationId: string,
  reporterId: string,
  changes: ReportChanges
) {
  return query(
    `UPDATE reports
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         category_id = COALESCE($3, category_id),
         priority = COALESCE($4, priority),
         updated_at = now()
     WHERE id = $5 AND organization_id = $6 AND reporter_id = $7 AND ${editableByReporter}
     RETURNING id`,
    [
      changes.title ?? null,
      changes.description ?? null,
      changes.categoryId ?? null,
      changes.priority ?? null,
      id,
      organizationId,
      reporterId
    ]
  );
}

export function deleteReportByReporter(id: string, organizationId: string, reporterId: string) {
  return query(
    `DELETE FROM reports
     WHERE id = $1 AND organization_id = $2 AND reporter_id = $3 AND ${editableByReporter}
     RETURNING id`,
    [id, organizationId, reporterId]
  );
}

/** Estado del reporte del autor, usado para explicar por qué una edición fue rechazada. */
export function findReporterEditState(id: string, organizationId: string, reporterId: string) {
  return query<{ status: Status; technicianId: string | null; withinWindow: boolean }>(
    `SELECT status, technician_id AS "technicianId",
            created_at >= now() - make_interval(mins => ${EDIT_WINDOW_MINUTES}) AS "withinWindow"
     FROM reports
     WHERE id = $1 AND organization_id = $2 AND reporter_id = $3`,
    [id, organizationId, reporterId]
  );
}

export function assignReportToTechnician(id: string, organizationId: string, technicianId: string) {
  return query(
    `UPDATE reports SET technician_id = $1, updated_at = now()
     WHERE id = $2 AND organization_id = $3 AND technician_id IS NULL
     RETURNING id`,
    [technicianId, id, organizationId]
  );
}

/** Cambia el estado solo si el estado actual sigue siendo `from` (control de concurrencia optimista). */
export function updateReportStatus(
  id: string,
  organizationId: string,
  technicianId: string,
  from: Status,
  to: Status,
  resolutionNotes: string | null
) {
  return query(
    `UPDATE reports
     SET status = $1, resolution_notes = COALESCE($2, resolution_notes), updated_at = now()
     WHERE id = $3 AND organization_id = $4 AND technician_id = $5 AND status = $6
     RETURNING id`,
    [to, resolutionNotes, id, organizationId, technicianId, from]
  );
}

export function reportExists(id: string, organizationId: string) {
  return query('SELECT 1 FROM reports WHERE id = $1 AND organization_id = $2', [id, organizationId]);
}

export function listReports(
  organizationId: string,
  role: Role,
  reporterId: string,
  filters: ReportFilters
) {
  const conditions = ['r.organization_id = $1'];
  const values: unknown[] = [organizationId];
  if (role === 'USER') {
    conditions.push(`r.reporter_id = $${values.length + 1}`);
    values.push(reporterId);
  }

  const fields = [
    ['status', 'status'],
    ['priority', 'priority'],
    ['categoryId', 'category_id'],
    ['technicianId', 'technician_id']
  ] as const;
  for (const [input, column] of fields) {
    if (filters[input]) {
      conditions.push(`r.${column} = $${values.length + 1}`);
      values.push(filters[input]);
    }
  }

  return query(`${reportSelect} WHERE ${conditions.join(' AND ')} ORDER BY r.created_at DESC`, values);
}

export function findReport(id: string, organizationId: string, role: Role, reporterId: string) {
  const conditions = ['r.id = $1', 'r.organization_id = $2'];
  const values: unknown[] = [id, organizationId];
  if (role === 'USER') {
    conditions.push('r.reporter_id = $3');
    values.push(reporterId);
  }
  return query(`${reportSelect} WHERE ${conditions.join(' AND ')}`, values);
}

export function findAssignedStatus(id: string, organizationId: string, technicianId: string) {
  return query<{ status: Status }>(
    `SELECT status FROM reports
     WHERE id = $1 AND organization_id = $2 AND technician_id = $3`,
    [id, organizationId, technicianId]
  );
}
