import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../shared/errors';

/** Errores lanzados por express.json() (body-parser). */
interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const parserError = error as BodyParserError;
  if (parserError?.type === 'entity.parse.failed') {
    return new ApiError(400, 'INVALID_JSON', 'El cuerpo de la petición no es JSON válido');
  }
  if (parserError?.type === 'entity.too.large') {
    return new ApiError(413, 'PAYLOAD_TOO_LARGE', 'El cuerpo de la petición es demasiado grande');
  }
  return new ApiError(500, 'INTERNAL_ERROR', 'Error interno del servidor');
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'NOT_FOUND', 'Recurso no encontrado'));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const apiError = toApiError(error);

  // FR-010: el detalle interno se registra en el servidor, nunca se envía al cliente.
  if (apiError.status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  }

  res.status(apiError.status).json({
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {})
    }
  });
}
