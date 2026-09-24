import {
  findAllFilterAttributes,
  findFilterAttributesByCategoryId,
} from "../repositories/filter.repository";

import { findCategoryById } from "../repositories/category.repository";

export async function listFilters() {
  return findAllFilterAttributes();
}

export async function getFiltersByCategoryId(categoryId: string) {
  const category = await findCategoryById(categoryId);

  if (!category) {
    return null;
  }

  const filters = await findFilterAttributesByCategoryId(categoryId);

  return {
    category,
    filters,
  };
}