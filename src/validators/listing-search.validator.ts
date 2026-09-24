import { z } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID");

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max);

const dynamicFiltersSchema = z
  .record(
    z
      .string()
      .trim()
      .min(1, "Filter name must not be empty")
      .max(120, "Filter name is too long"),
    z
      .string()
      .trim()
      .min(1, "Filter value must not be empty")
      .max(500, "Filter value is too long"),
  )
  .optional();

export const listingSearchSuggestQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "Search query is required")
    .max(100, "Search query is too long"),
});

export const listingSearchQuerySchema = z
  .object({
    q: optionalTrimmedString(200).optional(),

    make: optionalTrimmedString(100).optional(),

    model: optionalTrimmedString(100).optional(),

    min_price: z.coerce
      .number()
      .finite("Minimum price must be a valid number")
      .min(0, "Minimum price must be greater than or equal to 0")
      .optional(),

    max_price: z.coerce
      .number()
      .finite("Maximum price must be a valid number")
      .min(0, "Maximum price must be greater than or equal to 0")
      .optional(),

    year: z.coerce
      .number()
      .int("Year must be an integer")
      .min(1900, "Year must be at least 1900")
      .max(2100, "Year must not exceed 2100")
      .optional(),

    min_year: z.coerce
      .number()
      .int("Minimum year must be an integer")
      .min(1900, "Minimum year must be at least 1900")
      .max(2100, "Minimum year must not exceed 2100")
      .optional(),

    max_year: z.coerce
      .number()
      .int("Maximum year must be an integer")
      .min(1900, "Maximum year must be at least 1900")
      .max(2100, "Maximum year must not exceed 2100")
      .optional(),

    mileage_max: z.coerce
      .number()
      .int("Maximum mileage must be an integer")
      .min(0, "Maximum mileage must be greater than or equal to 0")
      .optional(),

    condition: z.enum(["new", "used"]).optional(),

    transmission: z
      .enum(["automatic", "manual", "cvt"])
      .optional(),

    fuel_type: z
      .enum([
        "bensin",
        "diesel",
        "hybrid",
        "electric",
      ])
      .optional(),

    color: optionalTrimmedString(50).optional(),

    category_id: uuidSchema.optional(),

    filter: dynamicFiltersSchema,

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
  })
  .refine(
    (data) =>
      data.min_price === undefined ||
      data.max_price === undefined ||
      data.min_price <= data.max_price,
    {
      message: "Minimum price cannot be greater than maximum price",
      path: ["min_price"],
    },
  )
  .refine(
    (data) =>
      data.min_year === undefined ||
      data.max_year === undefined ||
      data.min_year <= data.max_year,
    {
      message: "Minimum year cannot be greater than maximum year",
      path: ["min_year"],
    },
  )
  .refine(
    (data) =>
      data.year === undefined ||
      (data.min_year === undefined ||
        data.year >= data.min_year) &&
      (data.max_year === undefined ||
        data.year <= data.max_year),
    {
      message: "Year must be within the specified year range",
      path: ["year"],
    },
  );