import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(120, "Slug must not exceed 120 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

export const createCategorySchema = z.object({
  parent_id: z
    .string()
    .uuid("Invalid parent category ID")
    .nullable()
    .optional(),

  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must not exceed 100 characters"),

  slug: slugSchema,

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .nullable()
    .optional(),

  is_active: z
    .boolean()
    .optional()
    .default(true),
});

export const updateCategorySchema = z
  .object({
    parent_id: z
      .string()
      .uuid("Invalid parent category ID")
      .nullable()
      .optional(),

    name: z
      .string()
      .trim()
      .min(2, "Category name must be at least 2 characters")
      .max(100, "Category name must not exceed 100 characters")
      .optional(),

    slug: slugSchema.optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .nullable()
      .optional(),

    is_active: z
      .boolean()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    },
  );