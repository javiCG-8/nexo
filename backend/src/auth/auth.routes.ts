import { NextFunction, Request, Response, Router } from 'express';
import { ApiError } from '../shared/errors';
import { login } from './auth.service';

const router = Router();

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { organizationSlug, email, password } = req.body ?? {};
    if (!organizationSlug || !email || !password) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'organizationSlug, email y password son obligatorios');
    }
    res.json(await login(organizationSlug, email, password));
  } catch (error) {
    next(error);
  }
});

export default router;
