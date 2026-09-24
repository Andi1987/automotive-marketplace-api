import type { Request, Response } from "express";

import {
  getFiltersByCategoryId,
  listFilters,
} from "../services/filter.service";

function sanitizeFilterOption(option: {
  id: string;
  attribute_id: string;
  value: string;
  label: string;
  sort_order: number;
  created_at: Date;
}) {
  return {
    id: option.id,
    value: option.value,
    label: option.label,
    sort_order: option.sort_order,
  };
}

function sanitizeFilterAttribute(attribute: {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  type: "enum" | "range" | "boolean";
  is_filterable: boolean;
  created_at: Date;
  updated_at: Date;
  options: {
    id: string;
    attribute_id: string;
    value: string;
    label: string;
    sort_order: number;
    created_at: Date;
  }[];
}) {
  return {
    id: attribute.id,
    category_id: attribute.category_id,
    name: attribute.name,
    slug: attribute.slug,
    type: attribute.type,
    options: attribute.options.map(sanitizeFilterOption),
  };
}

function getCategoryId(req: Request): string | null {
  const { categoryId } = req.params;

  if (typeof categoryId !== "string") {
    return null;
  }

  return categoryId;
}

export async function getFilters(
  _req: Request,
  res: Response,
): Promise<void> {
  const filters = await listFilters();

  res.status(200).json({
    status: true,
    message: "Filters retrieved successfully",
    data: filters.map(sanitizeFilterAttribute),
  });
}

export async function getFiltersByCategory(
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

  const result = await getFiltersByCategoryId(categoryId);

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
    message: "Category filters retrieved successfully",
    data: {
      category: {
        id: result.category.id,
        parent_id: result.category.parent_id,
        name: result.category.name,
        slug: result.category.slug,
        description: result.category.description,
        is_active: result.category.is_active,
      },
      filters: result.filters.map(sanitizeFilterAttribute),
    },
  });
}