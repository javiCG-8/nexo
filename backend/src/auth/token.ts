import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthUser, Role } from '../shared/types';

const ALGORITHM = 'HS256';
const ISSUER = 'nexo-api';
const AUDIENCE = 'nexo-web';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

/** Datos mínimos que viajan en el token: sin nombre ni correo (minimización de datos). */
export interface SessionClaims {
  sub: string;
  org: string;
  role: Role;
}

export function signSession(user: Pick<AuthUser, 'id' | 'organizationId' | 'role'>): string {
  const claims: Omit<SessionClaims, 'sub'> = { org: user.organizationId, role: user.role };
  return jwt.sign(claims, env.authSecret, {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: user.id,
    expiresIn: SESSION_TTL_SECONDS
  });
}

/** Verifica firma, algoritmo, emisor, audiencia y expiración; lanza si algo no coincide. */
export function verifySession(token: string): SessionClaims {
  const payload = jwt.verify(token, env.authSecret, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE
  });
  if (typeof payload === 'string' || !payload.sub || !payload.org || !['USER', 'TECHNICIAN'].includes(payload.role)) {
    throw new Error('Token con formato inválido');
  }
  return { sub: payload.sub, org: payload.org, role: payload.role };
}
