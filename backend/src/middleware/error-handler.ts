import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../shared/errors';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError(500, 'INTERNAL_ERROR', 'Error interno del servidor');

  res.status(apiError.status).json({
    error: { code: apiError.code, message: apiError.message }
  });
}
