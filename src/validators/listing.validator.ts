import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID");

const imageUrlSchema = z
  .string()
  .trim()
  .url("Image URL must be a valid URL")
  .max(2048, "Image URL must not exceed 2048 characters");

const baseListingFields = {
  category_id: uuidSchema,

  make: z
    .string()
    .trim()
    .min(1, "Make is required")
    .max(100, "Make must not exceed 100 characters"),

  model: z
    .string()
    .trim()
    .min(1, "Model is required")
    .max(100, "Model must not exceed 100 characters"),

  year: z
    .number()
    .int("Year must be an integer")
    .min(1900, "Year must be at least 1900")
    .max(2100, "Year must not exceed 2100"),

  mileage: z
    .number()
    .int("Mileage must be an integer")
    .min(0, "Mileage must be greater than or equal to 0"),

  price: z
    .number()
    .min(0, "Price must be greater than or equal to 0"),

  condition: z.enum(["new", "used"]),

  transmission: z.enum([
    "automatic",
    "manual",
    "cvt",
  ]),

  fuel_type: z.enum([
    "bensin",
    "diesel",
    "hybrid",
    "electric",
  ]),

  color: z
    .string()
    .trim()
    .min(1, "Color is required")
    .max(50, "Color must not exceed 50 characters"),

  location: z
    .string()
    .trim()
    .min(1, "Location is required")
    .max(150, "Location must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(5000, "Description must not exceed 5000 characters")
    .nullable()
    .optional(),

  status: z
    .enum(["available", "pending", "sold"])
    .optional()
    .default("available"),

  images: z
    .array(imageUrlSchema)
    .max(20, "A listing cannot have more than 20 images")
    .optional()
    .default([]),
};

export const createListingSchema = z.object({
  ...baseListingFields,
});

export const updateListingSchema = z
  .object({
    category_id: uuidSchema.optional(),

    make: baseListingFields.make.optional(),

    model: baseListingFields.model.optional(),

    year: baseListingFields.year.optional(),

    mileage: baseListingFields.mileage.optional(),

    price: baseListingFields.price.optional(),

    condition: baseListingFields.condition.optional(),

    transmission: baseListingFields.transmission.optional(),

    fuel_type: baseListingFields.fuel_type.optional(),

    color: baseListingFields.color.optional(),

    location: baseListingFields.location.optional(),

    description: baseListingFields.description,

    status: baseListingFields.status,

    images: baseListingFields.images,
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    },
  );

export const listingQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must not exceed 100")
    .default(20),

  cursor: z
    .string()
    .trim()
    .min(1, "Cursor must not be empty")
    .optional(),

  category_id: uuidSchema.optional(),

  make: z
    .string()
    .trim()
    .min(1, "Make must not be empty")
    .optional(),

  model: z
    .string()
    .trim()
    .min(1, "Model must not be empty")
    .optional(),

  min_price: z.coerce
    .number()
    .min(0, "Minimum price must be greater than or equal to 0")
    .optional(),

  max_price: z.coerce
    .number()
    .min(0, "Maximum price must be greater than or equal to 0")
    .optional(),

  min_year: z.coerce
    .number()
    .int("Minimum year must be an integer")
    .min(1900, "Minimum year must be at least 1900")
    .optional(),

  max_year: z.coerce
    .number()
    .int("Maximum year must be an integer")
    .min(1900, "Maximum year must be at least 1900")
    .optional(),

  condition: z.enum([
    "new",
    "used",
  ]).optional(),

  transmission: z.enum([
    "automatic",
    "manual",
    "cvt",
  ]).optional(),

  fuel_type: z.enum([
    "bensin",
    "diesel",
    "hybrid",
    "electric",
  ]).optional(),

  color: z
    .string()
    .trim()
    .min(1, "Color must not be empty")
    .optional(),
});