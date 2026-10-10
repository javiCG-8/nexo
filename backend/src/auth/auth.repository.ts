import { query } from '../db/pool';
import { AuthUser } from '../shared/types';

export interface LoginRecord extends AuthUser {
  password_hash: string;
}

export async function findUserForLogin(
  organizationSlug: string,
  email: string
): Promise<LoginRecord | undefined> {
  const result = await query<LoginRecord>(
    `SELECT u.id, u.organization_id AS "organizationId", u.name, u.email, u.role, u.password_hash
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE o.slug = $1 AND lower(u.email) = lower($2)`,
    [organizationSlug, email]
  );
  return result.rows[0];
}
