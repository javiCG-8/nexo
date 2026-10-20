import { CookieOptions, Response } from 'express';
import { isProduction } from '../config/env';
import { SESSION_TTL_SECONDS } from './token';

export const SESSION_COOKIE = 'nexo_session';

const baseOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: isProduction,
  path: '/api'
};

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...baseOptions, maxAge: SESSION_TTL_SECONDS * 1000 });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, baseOptions);
}
