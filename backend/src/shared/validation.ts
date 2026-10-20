import { z } from 'zod';
import { ApiError } from './errors';

/**
 * Valida datos de entrada contra un esquema. Los datos inválidos se rechazan
 * con 400 VALIDATION_ERROR en lugar de intentar "limpiarlos".
 */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = result.error.issues.map(issue => ({
      field: issue.path.join('.') || '(body)',
      message: issue.message
    }));
    throw new ApiError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', fields);
  }
  return result.data;
}

export const idParamSchema = z.object({ id: z.uuid({ error: 'Identificador no válido' }) });
