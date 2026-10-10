import { query } from '../db/pool';

export function findActiveCategories(organizationId: string) {
  return query(
    `SELECT id, code, name, active
     FROM categories
     WHERE organization_id = $1 AND active = true
     ORDER BY name`,
    [organizationId]
  );
}

export function findActiveCategory(categoryId: string, organizationId: string) {
  return query(
    `SELECT id
     FROM categories
     WHERE id = $1 AND organization_id = $2 AND active = true`,
    [categoryId, organizationId]
  );
}
