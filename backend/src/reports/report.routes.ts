import { NextFunction, Request, Response, Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ApiError } from '../shared/errors';
import { AuthRequest, Priority, Status } from '../shared/types';
import {
  assignReport,
  changeReportStatus,
  createUserReport,
  getReport,
  getReports
} from './report.service';

const router = Router();
const currentUser = (req: Request) => {
  const current = (req as AuthRequest).user;
  if (!current) throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Se requiere autenticación');
  return current;
};

const routeParam = (value: string | string[]) => Array.isArray(value) ? value[0] : value;

router.post('/', authenticate, authorize('USER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json(await createUserReport(currentUser(req), req.body ?? {}));
  } catch (error) {
    next(error);
  }
});

router.get('/', authenticate, authorize('USER', 'TECHNICIAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      categoryId: req.query.categoryId,
      technicianId: req.query.technicianId
    };
    const result = await getReports(currentUser(req), filters);
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, authorize('USER', 'TECHNICIAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getReport(currentUser(req), routeParam(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/assignment', authenticate, authorize('TECHNICIAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body?.assignToMe !== true) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'assignToMe debe ser true');
    }
    res.json(await assignReport(currentUser(req), routeParam(req.params.id)));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authenticate, authorize('TECHNICIAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await changeReportStatus(currentUser(req), routeParam(req.params.id), req.body?.status as Status));
  } catch (error) {
    next(error);
  }
});

export default router;
