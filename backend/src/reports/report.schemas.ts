import { z } from 'zod';

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'] as const;

const title = z.string().trim().min(3, 'El título debe tener al menos 3 caracteres').max(150);
const description = z.string().trim().min(10, 'La descripción debe tener al menos 10 caracteres').max(5000);
const categoryId = z.uuid({ error: 'Categoría no válida' });
const priority = z.enum(PRIORITIES, { error: 'Prioridad no válida' });

export const createReportSchema = z.strictObject({ title, description, categoryId, priority });

export const updateReportSchema = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    categoryId: categoryId.optional(),
    priority: priority.optional()
  })
  .refine(changes => Object.values(changes).some(value => value !== undefined), {
    error: 'Debe enviar al menos un campo para actualizar'
  });

export const changeStatusSchema = z
  .strictObject({
    status: z.enum(STATUSES, { error: 'Estado no válido' }),
    resolutionNotes: z.string().trim().min(5, 'Las notas deben tener al menos 5 caracteres').max(2000).optional()
  })
  .refine(body => body.status !== 'RESOLVED' || body.resolutionNotes !== undefined, {
    error: 'Las notas de solución son obligatorias al resolver',
    path: ['resolutionNotes']
  });

export const assignmentSchema = z.strictObject({
  assignToMe: z.literal(true, { error: 'assignToMe debe ser true' })
});

/** Los filtros de consulta llegan como texto; se rechazan arreglos (?status=a&status=b) y valores fuera de catálogo. */
export const reportFiltersSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  categoryId: z.uuid().optional(),
  technicianId: z.uuid().optional()
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
