import type {
  Request,
  Response,
} from "express";

import {
  createNewCategory,
  getCategoryById,
  getCategoryListings as getCategoryListingsService,
  listCategories,
  updateExistingCategory,
} from "../services/category.service";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator";

function getCategoryId(
  req: Request,
): string | null {
  const { id } = req.params;

  if (typeof id !== "string") {
    return null;
  }

  return id;
}

function sanitizeCategory(category: {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: category.id,
    parent_id: category.parent_id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    is_active: category.is_active,
    created_at: category.created_at,
    updated_at: category.updated_at,
  };
}

export async function getCategories(
  _req: Request,
  res: Response,
): Promise<void> {
  const categories = await listCategories();

  res.status(200).json({
    status: true,
    message: "Categories retrieved successfully",
    data: categories.map(sanitizeCategory),
  });
}

export async function getCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const categoryId = getCategoryId(req);

  if (!categoryId) {
    res.status(400).json({
      status: false,
      message: "Invalid category ID",
      data: null,
    });

    return;
  }

  const category =
    await getCategoryById(categoryId);

  if (!category) {
    res.status(404).json({
      status: false,
      message: "Category not found",
      data: null,
    });

    return;
  }

  res.status(200).json({
    status: true,
    message: "Category retrieved successfully",
    data: sanitizeCategory(category),
  });
}

export async function getCategoryListings(
  req: Request,
  res: Response,
): Promise<void> {
  const categoryId = getCategoryId(req);

  if (!categoryId) {
    res.status(400).json({
      status: false,
      message: "Invalid category ID",
      data: null,
    });

    return;
  }

  const result =
    await getCategoryListingsService(categoryId);

  if (!result) {
    res.status(404).json({
      status: false,
      message: "Category not found",
      data: null,
    });

    return;
  }

  res.status(200).json({
    status: true,
    message:
      "Category listings retrieved successfully",
    data: {
      category: sanitizeCategory(result.category),
      listings: result.listings,
    },
  });
}

export async function createCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed =
    createCategorySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });

    return;
  }

  try {
    const category =
      await createNewCategory(parsed.data);

    res.status(201).json({
      status: true,
      message: "Category created successfully",
      data: sanitizeCategory(category),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.message ===
          "Parent category not found" ||
        error.message ===
          "Category slug already exists"
      )
    ) {
      const statusCode =
        error.message ===
        "Parent category not found"
          ? 404
          : 409;

      res.status(statusCode).json({
        status: false,
        message: error.message,
        data: null,
      });

      return;
    }

    throw error;
  }
}

export async function updateCategory(
  req: Request,
  res: Response,
): Promise<void> {
  const categoryId = getCategoryId(req);

  if (!categoryId) {
    res.status(400).json({
      status: false,
      message: "Invalid category ID",
      data: null,
    });

    return;
  }

  const parsed =
    updateCategorySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });

    return;
  }

  try {
    const category =
      await updateExistingCategory(
        categoryId,
        parsed.data,
      );

    if (!category) {
      res.status(404).json({
        status: false,
        message: "Category not found",
        data: null,
      });

      return;
    }

    res.status(200).json({
      status: true,
      message: "Category updated successfully",
      data: sanitizeCategory(category),
    });
  } catch (error) {
    if (error instanceof Error) {
      const knownErrors = new Set([
        "Parent category not found",
        "Category slug already exists",
        "Category cannot be its own parent",
        "Category cannot be moved under its descendant",
      ]);

      if (knownErrors.has(error.message)) {
        const statusCode =
          error.message ===
          "Parent category not found"
            ? 404
            : 409;

        res.status(statusCode).json({
          status: false,
          message: error.message,
          data: null,
        });

        return;
      }
    }

    throw error;
  }
}