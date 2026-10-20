import bcrypt from 'bcryptjs';
import { ApiError } from '../shared/errors';
import { findUserById, findUserForLogin } from './auth.repository';
import { LoginInput } from './auth.schemas';
import { signSession } from './token';

/**
 * Hash bcrypt de una contraseña aleatoria descartada. Se compara contra él cuando
 * el usuario no existe para que el tiempo de respuesta no revele qué correos están registrados.
 */
const DUMMY_HASH = '$2b$10$tbK4K2gEcOJmho.yVE/Cdeh8f7XXotD9YUoU8ZQmizkHNRrXqTZl6';

const invalidCredentials = () => new ApiError(401, 'AUTHENTICATION_FAILED', 'Credenciales inválidas');

export async function login({ organizationSlug, email, password }: LoginInput) {
  const candidate = await findUserForLogin(organizationSlug, email);
  const passwordMatches = await bcrypt.compare(password, candidate?.password_hash ?? DUMMY_HASH);
  if (!candidate || !passwordMatches) throw invalidCredentials();

  const { password_hash: _hash, ...user } = candidate;
  return { token: signSession(user), user };
}

export async function currentProfile(id: string, organizationId: string) {
  const user = await findUserById(id, organizationId);
  if (!user) throw new ApiError(401, 'SESSION_EXPIRED', 'La sesión ya no es válida');
  return user;
}
