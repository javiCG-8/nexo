import { ApiError } from '../shared/errors';
import { AuthUser, Status } from '../shared/types';
import { categoryIsActive } from '../categories/category.service';
import {
  assignReportToTechnician,
  createReport,
  deleteReportByReporter,
  EDIT_WINDOW_MINUTES,
  findAssignedStatus,
  findReport,
  findReporterEditState,
  listReports,
  ReportFilters,
  reportExists,
  updateReportByReporter,
  updateReportStatus
} from './report.repository';
import { ChangeStatusInput, CreateReportInput, UpdateReportInput } from './report.schemas';

/** Máquina de estados del reporte: cada estado tiene como máximo un sucesor. */
const NEXT_STATUS: Record<Status, Status | null> = {
  OPEN: 'IN_PROGRESS',
  IN_PROGRESS: 'RESOLVED',
  RESOLVED: null
};

const notFound = () => new ApiError(404, 'REPORT_NOT_FOUND', 'Reporte no encontrado');

async function assertActiveCategory(categoryId: string, organizationId: string) {
  if (!(await categoryIsActive(categoryId, organizationId))) {
    throw new ApiError(400, 'INVALID_CATEGORY', 'La categoría no existe o no está activa');
  }
}

async function loadReport(current: AuthUser, id: string) {
  const result = await findReport(id, current.organizationId, current.role, current.id);
  if (result.rowCount === 0) throw notFound();
  return result.rows[0];
}

/** Explica por qué el autor ya no puede modificar su reporte. */
async function explainLockedReport(current: AuthUser, id: string, action: 'editar' | 'cancelar'): Promise<never> {
  const state = await findReporterEditState(id, current.organizationId, current.id);
  if (state.rowCount === 0) throw notFound();
  const { status, technicianId, withinWindow } = state.rows[0];
  if (status !== 'OPEN' || technicianId) {
    throw new ApiError(409, 'REPORT_LOCKED', `No se puede ${action} un reporte que ya está en atención o resuelto`);
  }
  if (!withinWindow) {
    throw new ApiError(
      409,
      'EDIT_WINDOW_EXPIRED',
      `El periodo de ${EDIT_WINDOW_MINUTES} minutos para ${action} el reporte ha expirado`
    );
  }
  // Si llega aquí, el reporte cambió entre ambas consultas: se informa como bloqueado.
  throw new ApiError(409, 'REPORT_LOCKED', `No se puede ${action} el reporte en este momento`);
}

export async function createUserReport(current: AuthUser, input: CreateReportInput) {
  await assertActiveCategory(input.categoryId, current.organizationId);
  const created = await createReport(
    current.organizationId, current.id, input.title, input.description, input.categoryId, input.priority
  );
  return loadReport(current, created.rows[0].id);
}

export async function updateUserReport(current: AuthUser, id: string, input: UpdateReportInput) {
  if (input.categoryId) await assertActiveCategory(input.categoryId, current.organizationId);
  const updated = await updateReportByReporter(id, current.organizationId, current.id, input);
  if (updated.rowCount === 0) await explainLockedReport(current, id, 'editar');
  return loadReport(current, id);
}

export async function deleteUserReport(current: AuthUser, id: string) {
  const deleted = await deleteReportByReporter(id, current.organizationId, current.id);
  if (deleted.rowCount === 0) await explainLockedReport(current, id, 'cancelar');
  return { message: 'Reporte cancelado correctamente', id };
}

export function getReports(current: AuthUser, filters: ReportFilters) {
  return listReports(current.organizationId, current.role, current.id, filters);
}

export function getReport(current: AuthUser, id: string) {
  return loadReport(current, id);
}

export async function assignReport(current: AuthUser, id: string) {
  const assigned = await assignReportToTechnician(id, current.organizationId, current.id);
  if (assigned.rowCount === 0) {
    const exists = await reportExists(id, current.organizationId);
    if (exists.rowCount === 0) throw notFound();
    throw new ApiError(409, 'REPORT_ALREADY_ASSIGNED', 'El reporte ya fue asignado');
  }
  return loadReport(current, id);
}

export async function changeReportStatus(current: AuthUser, id: string, input: ChangeStatusInput) {
  const result = await findAssignedStatus(id, current.organizationId, current.id);
  if (result.rowCount === 0) throw notFound();

  const from = result.rows[0].status;
  if (NEXT_STATUS[from] !== input.status) {
    throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'La transición de estado no es válida');
  }

  const notes = input.status === 'RESOLVED' ? input.resolutionNotes ?? null : null;
  const updated = await updateReportStatus(id, current.organizationId, current.id, from, input.status, notes);
  if (updated.rowCount === 0) {
    throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'El reporte cambió de estado; recargue e intente de nuevo');
  }
  return loadReport(current, id);
}
