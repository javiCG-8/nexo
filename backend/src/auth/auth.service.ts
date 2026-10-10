import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../shared/errors';
import { AuthUser } from '../shared/types';
import { findUserForLogin } from './auth.repository';

export async function login(
  organizationSlug: string,
  email: string,
  password: string
) {
  const candidate = await findUserForLogin(organizationSlug, email);
  if (!candidate || !(await bcrypt.compare(password, candidate.password_hash))) {
    throw new ApiError(401, 'AUTHENTICATION_FAILED', 'Credenciales inválidas');
  }

  const authUser: AuthUser = {
    id: candidate.id,
    organizationId: candidate.organizationId,
    name: candidate.name,
    email: candidate.email,
    role: candidate.role
  };

  return {
    token: jwt.sign(authUser, env.authSecret, { expiresIn: '8h' }),
    user: authUser
  };
}
