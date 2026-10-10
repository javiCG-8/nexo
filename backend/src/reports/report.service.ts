import { inTransaction, query } from '../db/pool';
import { ApiError } from '../shared/errors';
import { AuthUser, Priority, Status } from '../shared/types';
import { categoryIsActive } from '../categories/category.service';
import {
  createReport,
  findAssignedStatus,
  findReport,
  listReports,
  reportSelect
} from './report.repository';

const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statuses: Status[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

export async function createUserReport(
  current: AuthUser,
  input: { title?: string; description?: string; categoryId?: string; priority?: Priority }
) {
  const { title, description, categoryId, priority } = input;
  if (!title || !description || !categoryId || !priority) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'title, description, categoryId y priority son obligatorios');
  }
  if (!priorities.includes(priority)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'La prioridad no es válida');
  }
  if (!(await categoryIsActive(categoryId, current.organizationId))) {
    throw new ApiError(400, 'INVALID_CATEGORY', 'La categoría no existe o no está activa');
  }
  const result = await createReport(
    current.organizationId, current.id, title, description, categoryId, priority
  );
  return result.rows[0];
}

export function getReports(current: AuthUser, filters: Record<string, unknown>) {
  return listReports(current.organizationId, current.role, current.id, filters);
}

export async function getReport(current: AuthUser, id: string) {
  const result = await findReport(id, current.organizationId, current.role, current.id);
  if (result.rowCount === 0) throw new ApiError(404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
  return result.rows[0];
}

export async function assignReport(current: AuthUser, id: string) {
  const assigned = await inTransaction(async client => client.query(
    `UPDATE reports SET technician_id = $1, updated_at = now()
     WHERE id = $2 AND organization_id = $3 AND technician_id IS NULL
     RETURNING id`,
    [current.id, id, current.organizationId]
  ));

  if (assigned.rowCount === 0) {
    const exists = await query(
      'SELECT 1 FROM reports WHERE id = $1 AND organization_id = $2',
      [id, current.organizationId]
    );
    if (exists.rowCount === 0) throw new ApiError(404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');
    throw new ApiError(409, 'REPORT_ALREADY_ASSIGNED', 'El reporte ya fue asignado');
  }

  const updated = await query(
    `${reportSelect} WHERE r.id = $1 AND r.organization_id = $2`,
    [id, current.organizationId]
  );
  return updated.rows[0];
}

export async function changeReportStatus(current: AuthUser, id: string, status: Status) {
  if (!statuses.includes(status)) throw new ApiError(400, 'VALIDATION_ERROR', 'El estado no es válido');
  const result = await findAssignedStatus(id, current.organizationId, current.id);
  if (result.rowCount === 0) throw new ApiError(404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');

  const allowed: Record<Status, Status | null> = {
    OPEN: 'IN_PROGRESS',
    IN_PROGRESS: 'RESOLVED',
    RESOLVED: null
  };
  if (allowed[result.rows[0].status] !== status) {
    throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'La transición de estado no es válida');
  }

  await query(
    `UPDATE reports SET status = $1, updated_at = now()
     WHERE id = $2 AND organization_id = $3 AND technician_id = $4`,
    [status, id, current.organizationId, current.id]
  );
  const updated = await query(
    `${reportSelect} WHERE r.id = $1 AND r.organization_id = $2`,
    [id, current.organizationId]
  );
  return updated.rows[0];
}
