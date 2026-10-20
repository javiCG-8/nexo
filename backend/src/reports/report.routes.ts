import { NextFunction, Request, Response, Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { ApiError } from '../shared/errors';
import { AuthRequest } from '../shared/types';
import { idParamSchema, parse } from '../shared/validation';
import {
  assignmentSchema,
  changeStatusSchema,
  createReportSchema,
  reportFiltersSchema,
  updateReportSchema
} from './report.schemas';
import {
  assignReport,
  changeReportStatus,
  createUserReport,
  deleteUserReport,
  getReport,
  getReports,
  updateUserReport
} from './report.service';

const router = Router();

const currentUser = (req: Request) => {
  const current = (req as AuthRequest).user;
  if (!current) throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Se requiere autenticación');
  return current;
};

const reportId = (req: Request) => parse(idParamSchema, req.params).id;

/** Envuelve un handler asíncrono para delegar cualquier error al middleware central. */
const handle = (work: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    work(req, res).catch(next);
  };

router.use(authenticate);

router.post('/', authorize('USER'), handle(async (req, res) => {
  res.status(201).json(await createUserReport(currentUser(req), parse(createReportSchema, req.body)));
}));

router.put('/:id', authorize('USER'), handle(async (req, res) => {
  res.json(await updateUserReport(currentUser(req), reportId(req), parse(updateReportSchema, req.body)));
}));

router.delete('/:id', authorize('USER'), handle(async (req, res) => {
  res.json(await deleteUserReport(currentUser(req), reportId(req)));
}));

router.get('/', authorize('USER', 'TECHNICIAN'), handle(async (req, res) => {
  const result = await getReports(currentUser(req), parse(reportFiltersSchema, req.query));
  res.json({ items: result.rows });
}));

router.get('/:id', authorize('USER', 'TECHNICIAN'), handle(async (req, res) => {
  res.json(await getReport(currentUser(req), reportId(req)));
}));

router.patch('/:id/assignment', authorize('TECHNICIAN'), handle(async (req, res) => {
  parse(assignmentSchema, req.body);
  res.json(await assignReport(currentUser(req), reportId(req)));
}));

router.patch('/:id/status', authorize('TECHNICIAN'), handle(async (req, res) => {
  res.json(await changeReportStatus(currentUser(req), reportId(req), parse(changeStatusSchema, req.body)));
}));

export default router;
