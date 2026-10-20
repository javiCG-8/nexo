import { NextFunction, Response } from 'express';
import { SESSION_COOKIE } from '../auth/session-cookie';
import { verifySession } from '../auth/token';
import { ApiError } from '../shared/errors';
import { AuthRequest } from '../shared/types';

/** Obtiene el token de la cookie HttpOnly (navegador) o del encabezado Bearer (clientes de API). */
function extractToken(req: AuthRequest): string | undefined {
  const fromCookie = req.cookies?.[SESSION_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;
  const header = req.header('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    next(new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Se requiere autenticación'));
    return;
  }

  try {
    const claims = verifySession(token);
    req.user = { id: claims.sub, organizationId: claims.org, role: claims.role };
    next();
  } catch {
    next(new ApiError(401, 'INVALID_TOKEN', 'La sesión no es válida o expiró'));
  }
}
