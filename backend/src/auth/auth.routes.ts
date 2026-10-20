import { NextFunction, Request, Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/authenticate';
import { AuthRequest } from '../shared/types';
import { parse } from '../shared/validation';
import { loginSchema } from './auth.schemas';
import { currentProfile, login } from './auth.service';
import { clearSessionCookie, setSessionCookie } from './session-cookie';

const router = Router();

/** FR-004: 10 intentos fallidos por IP cada 15 minutos; los exitosos no cuentan. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: { code: 'TOO_MANY_REQUESTS', message: 'Demasiados intentos. Espere 15 minutos e intente de nuevo.' }
    });
  }
});

router.post('/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, user } = await login(parse(loginSchema, req.body));
    setSessionCookie(res, token);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = (req as AuthRequest).user!;
    res.json({ user: await currentProfile(current.id, current.organizationId) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.status(204).end();
});

export default router;
