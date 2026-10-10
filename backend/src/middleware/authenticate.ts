import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../shared/errors';
import { AuthRequest, AuthUser } from '../shared/types';

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Se requiere autenticación');
    }

    const payload = jwt.verify(header.slice(7), env.authSecret) as AuthUser;
    if (!payload.id || !payload.organizationId || !payload.role) {
      throw new ApiError(401, 'INVALID_TOKEN', 'El token no es válido');
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'INVALID_TOKEN', 'El token no es válido'));
  }
}
