import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../shared/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * FR-008 (anti-CSRF): un formulario HTML de otro sitio no puede enviar
 * `application/json` sin una petición preflight, que CORS bloquea.
 * Solo se exige cuando la petición trae cuerpo.
 */
export function requireJson(req: Request, _res: Response, next: NextFunction) {
  const hasBody = Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined;
  if (SAFE_METHODS.has(req.method) || !hasBody || req.is('application/json')) {
    next();
    return;
  }
  next(new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'El cuerpo debe enviarse como application/json'));
}
