import { findActiveCategories, findActiveCategory } from './category.repository';

export function listCategories(organizationId: string) {
  return findActiveCategories(organizationId);
}

export async function categoryIsActive(categoryId: string, organizationId: string) {
  const result = await findActiveCategory(categoryId, organizationId);
  return result.rowCount !== 0;
}
