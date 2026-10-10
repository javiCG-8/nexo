import { NextFunction, Response } from 'express';
import { ApiError } from '../shared/errors';
import { AuthRequest, Role } from '../shared/types';

export const authorize = (...roles: Role[]) => (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    next(new ApiError(403, 'FORBIDDEN', 'No tienes permisos para esta operación'));
    return;
  }
  next();
};
