import {
  createCategory,
  findAllCategories,
  findCategoryById,
  findCategoryBySlug,
  findCategoryDescendants,
  findCategoryTree,
  hasChildren,
  updateCategory,
} from "../repositories/category.repository";

import {
  findListingsByCategoryId,
} from "../repositories/category-listing.repository";

import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../repositories/category.repository";

export async function listCategories() {
  return findAllCategories();
}

export async function getCategoryById(
  id: string,
) {
  return findCategoryById(id);
}

export async function getCategoryTree() {
  return findCategoryTree();
}

export async function getCategoryDescendants(
  id: string,
) {
  return findCategoryDescendants(id);
}

export async function getCategoryListings(
  id: string,
) {
  const category = await findCategoryById(id);

  if (!category) {
    return null;
  }

  const listings =
    await findListingsByCategoryId(id);

  return {
    category,
    listings,
  };
}

export async function createNewCategory(
  input: CreateCategoryInput,
) {
  if (input.parent_id) {
    const parent = await findCategoryById(
      input.parent_id,
    );

    if (!parent) {
      throw new Error("Parent category not found");
    }
  }

  const existingSlug =
    await findCategoryBySlug(input.slug);

  if (existingSlug) {
    throw new Error(
      "Category slug already exists",
    );
  }

  return createCategory(input);
}

export async function updateExistingCategory(
  id: string,
  input: UpdateCategoryInput,
) {
  const category = await findCategoryById(id);

  if (!category) {
    return null;
  }

  if (input.parent_id !== undefined) {
    if (input.parent_id === id) {
      throw new Error(
        "Category cannot be its own parent",
      );
    }

    if (input.parent_id) {
      const parent = await findCategoryById(
        input.parent_id,
      );

      if (!parent) {
        throw new Error(
          "Parent category not found",
        );
      }

      const descendants =
        await findCategoryDescendants(id);

      const isDescendant = descendants.some(
        (item) =>
          item.id === input.parent_id,
      );

      if (isDescendant) {
        throw new Error(
          "Category cannot be moved under its descendant",
        );
      }
    }
  }

  if (
    input.slug !== undefined &&
    input.slug !== category.slug
  ) {
    const existingSlug =
      await findCategoryBySlug(input.slug);

    if (
      existingSlug &&
      existingSlug.id !== id
    ) {
      throw new Error(
        "Category slug already exists",
      );
    }
  }

  return updateCategory(id, input);
}

export async function canDeleteCategory(
  id: string,
): Promise<boolean> {
  return !(await hasChildren(id));
}