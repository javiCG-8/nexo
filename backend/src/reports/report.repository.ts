import { query } from '../db/pool';
import { Priority, Status } from '../shared/types';

export const reportSelect = `
  SELECT r.id, r.organization_id AS "organizationId", r.title, r.description,
         r.category_id AS "categoryId", c.code AS "categoryCode", c.name AS "categoryName",
         r.priority, r.status, r.reporter_id AS "reporterId",
         r.technician_id AS "technicianId", t.name AS "technicianName",
         r.created_at AS "createdAt", r.updated_at AS "updatedAt"
  FROM reports r
  JOIN categories c ON c.id = r.category_id AND c.organization_id = r.organization_id
  LEFT JOIN users t ON t.id = r.technician_id AND t.organization_id = r.organization_id`;

export function createReport(
  organizationId: string,
  reporterId: string,
  title: string,
  description: string,
  categoryId: string,
  priority: Priority
) {
  return query(
    `INSERT INTO reports (organization_id, title, description, category_id, priority, reporter_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, organization_id AS "organizationId", title, description,
       category_id AS "categoryId", priority, status,
       reporter_id AS "reporterId", technician_id AS "technicianId",
       created_at AS "createdAt", updated_at AS "updatedAt"`,
    [organizationId, title.trim(), description.trim(), categoryId, priority, reporterId]
  );
}

export function listReports(
  organizationId: string,
  role: string,
  reporterId: string,
  filters: Record<string, unknown>
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

export function findReport(
  id: string,
  organizationId: string,
  role: string,
  reporterId: string
) {
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
