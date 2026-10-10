import { NextFunction, Request, Response, Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { AuthRequest } from '../shared/types';
import { listCategories } from './category.service';

const router = Router();

router.get('/', authenticate, authorize('USER', 'TECHNICIAN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = (req as AuthRequest).user!;
    const result = await listCategories(current.organizationId);
    res.json({ items: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
