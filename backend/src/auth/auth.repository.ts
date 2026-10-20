import { query } from '../db/pool';
import { AuthUser } from '../shared/types';

export interface LoginRecord extends AuthUser {
  password_hash: string;
}

const userColumns = `u.id, u.organization_id AS "organizationId", u.name, u.email, u.role, o.slug AS "organizationSlug"`;

export async function findUserForLogin(
  organizationSlug: string,
  email: string
): Promise<(LoginRecord & { organizationSlug: string }) | undefined> {
  const result = await query<LoginRecord & { organizationSlug: string }>(
    `SELECT ${userColumns}, u.password_hash
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE o.slug = $1 AND lower(u.email) = lower($2)`,
    [organizationSlug, email]
  );
  return result.rows[0];
}

export async function findUserById(
  id: string,
  organizationId: string
): Promise<(AuthUser & { organizationSlug: string }) | undefined> {
  const result = await query<AuthUser & { organizationSlug: string }>(
    `SELECT ${userColumns}
     FROM users u
     JOIN organizations o ON o.id = u.organization_id
     WHERE u.id = $1 AND u.organization_id = $2`,
    [id, organizationId]
  );
  return result.rows[0];
}
