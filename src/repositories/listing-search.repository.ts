import { pool } from "../config/database";

export interface ListingSearchInput {
  q?: string;
  make?: string;
  model?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  year?: number;
  mileage_max?: number;
  condition?: "new" | "used";
  transmission?: "automatic" | "manual" | "cvt";
  fuel_type?: "bensin" | "diesel" | "hybrid" | "electric";
  color?: string;
  category_id?: string;

  filter?: Record<string, string>;

  limit: number;
  cursor?: ListingSearchCursor;
}

export interface ListingSearchCursor {
  created_at: Date;
  id: string;
}

export interface ListingSearchResult {
  id: string;
  seller_id: string | null;
  category_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: string;
  condition: string;
  transmission: string;
  fuel_type: string;
  color: string;
  location: string;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface ListingSearchPage {
  listings: ListingSearchResult[];
  nextCursor: string | null;
}

export interface ListingSearchSuggestionPage {
  items: string[];
}

function encodeCursor(cursor: ListingSearchCursor): string {
  return Buffer.from(
    JSON.stringify({
      created_at: cursor.created_at.toISOString(),
      id: cursor.id,
    }),
  ).toString("base64url");
}

export function decodeSearchCursor(cursor: string): ListingSearchCursor {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");

  const parsed = JSON.parse(decoded) as {
    created_at?: unknown;
    id?: unknown;
  };

  if (
    typeof parsed.created_at !== "string" ||
    typeof parsed.id !== "string"
  ) {
    throw new Error("Invalid search cursor");
  }

  const createdAt = new Date(parsed.created_at);

  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("Invalid search cursor");
  }

  return {
    created_at: createdAt,
    id: parsed.id,
  };
}

export async function searchListings(
  input: ListingSearchInput,
): Promise<ListingSearchPage> {
  const conditions: string[] = [
    "l.status <> 'removed'",
  ];

  const values: unknown[] = [];

  function addValue(value: unknown): string {
    values.push(value);
    return `$${values.length}`;
  }

  if (input.q) {
    const parameter = addValue(input.q);

    conditions.push(`
      l.search_vector @@ plainto_tsquery('simple', ${parameter})
    `);
  }

  if (input.make) {
    const parameter = addValue(input.make);

    conditions.push(`
      l.make ILIKE ${parameter}
    `);
  }

  if (input.model) {
    const parameter = addValue(input.model);

    conditions.push(`
      l.model ILIKE ${parameter}
    `);
  }

  if (input.min_price !== undefined) {
    const parameter = addValue(input.min_price);

    conditions.push(`
      l.price >= ${parameter}
    `);
  }

  if (input.max_price !== undefined) {
    const parameter = addValue(input.max_price);

    conditions.push(`
      l.price <= ${parameter}
    `);
  }

  if (input.year !== undefined) {
    const parameter = addValue(input.year);

    conditions.push(`
      l.year = ${parameter}
    `);
  }

  if (input.min_year !== undefined) {
    const parameter = addValue(input.min_year);

    conditions.push(`
      l.year >= ${parameter}
    `);
  }

  if (input.max_year !== undefined) {
    const parameter = addValue(input.max_year);

    conditions.push(`
      l.year <= ${parameter}
    `);
  }

  if (input.mileage_max !== undefined) {
    const parameter = addValue(input.mileage_max);

    conditions.push(`
      l.mileage <= ${parameter}
    `);
  }

  if (input.condition) {
    const parameter = addValue(input.condition);

    conditions.push(`
      l.condition = ${parameter}
    `);
  }

  if (input.transmission) {
    const parameter = addValue(input.transmission);

    conditions.push(`
      l.transmission = ${parameter}
    `);
  }

  if (input.fuel_type) {
    const parameter = addValue(input.fuel_type);

    conditions.push(`
      l.fuel_type = ${parameter}
    `);
  }

  if (input.color) {
    const parameter = addValue(input.color);

    conditions.push(`
      l.color ILIKE ${parameter}
    `);
  }

  if (input.category_id) {
    const parameter = addValue(input.category_id);

    conditions.push(`
      l.category_id = ${parameter}
    `);
  }

  /*
   * Dynamic category-specific filters.
   *
   * Supported attribute types:
   *
   * enum:
   *   filter[transmission]=automatic
   *
   * boolean:
   *   filter[sunroof]=true
   *
   * range:
   *   filter[engine_capacity]=1500
   *
   * Each filter uses EXISTS so multiple dynamic filters
   * cannot duplicate the same listing.
   */

  if (input.filter) {
    for (const [attributeSlug, filterValue] of Object.entries(
      input.filter,
    )) {
      const attributeSlugParameter = addValue(attributeSlug);
      const filterValueParameter = addValue(filterValue);

      conditions.push(`
        EXISTS (
          SELECT 1
          FROM listing_attribute_values lav
          INNER JOIN filter_attributes fa
            ON fa.id = lav.attribute_id
          LEFT JOIN filter_attribute_options fao
            ON fao.id = lav.option_id
          WHERE lav.listing_id = l.id
            AND fa.slug = ${attributeSlugParameter}
            AND fa.is_filterable = TRUE
            AND (
              (
                fa.type = 'enum'
                AND fao.value = ${filterValueParameter}
              )
              OR
              (
                fa.type = 'boolean'
                AND LOWER(${filterValueParameter}) IN ('true', 'false')
                AND lav.value_boolean = (
                  LOWER(${filterValueParameter}) = 'true'
                )
              )
              OR
              (
                fa.type = 'range'
                AND CASE
                  WHEN ${filterValueParameter}
                    ~ '^-?[0-9]+(\\.[0-9]+)?$'
                  THEN lav.value_number =
                    ${filterValueParameter}::numeric
                  ELSE FALSE
                END
              )
            )
        )
      `);
    }
  }

  if (input.cursor) {
    const createdAtParameter = addValue(input.cursor.created_at);
    const idParameter = addValue(input.cursor.id);

    conditions.push(`
      (
        l.created_at < ${createdAtParameter}
        OR (
          l.created_at = ${createdAtParameter}
          AND l.id < ${idParameter}
        )
      )
    `);
  }

  const limitParameter = addValue(input.limit + 1);

  const query = `
    SELECT
      l.id,
      l.seller_id,
      l.category_id,
      l.make,
      l.model,
      l.year,
      l.mileage,
      l.price,
      l.condition,
      l.transmission,
      l.fuel_type,
      l.color,
      l.location,
      l.description,
      l.status,
      l.created_at,
      l.updated_at
    FROM listings l
    WHERE ${conditions.join("\n      AND ")}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT ${limitParameter}
  `;

  const result = await pool.query<ListingSearchResult>(
    query,
    values,
  );

  const hasNextPage = result.rows.length > input.limit;

  const listings = hasNextPage
    ? result.rows.slice(0, input.limit)
    : result.rows;

  const lastListing = listings.at(-1);

  const nextCursor =
    hasNextPage && lastListing
      ? encodeCursor({
          created_at: lastListing.created_at,
          id: lastListing.id,
        })
      : null;

  return {
    listings,
    nextCursor,
  };
}

/**
 * Search autocomplete suggestions.
 *
 * Suggestions are generated from:
 * - make
 * - model
 *
 * Only active marketplace listings are considered.
 * Removed listings are excluded.
 *
 * Matching is case-insensitive prefix matching.
 */
export async function searchListingSuggestions(
  query: string,
  limit = 10,
): Promise<ListingSearchSuggestionPage> {
  const searchParameter = query.trim();
  const pattern = `${searchParameter}%`;

  const result = await pool.query<{ suggestion: string }>(
    `
      SELECT DISTINCT suggestion
      FROM (
        SELECT
          l.make AS suggestion
        FROM listings l
        WHERE l.status <> 'removed'
          AND l.make ILIKE $1

        UNION

        SELECT
          CONCAT(l.make, ' ', l.model) AS suggestion
        FROM listings l
        WHERE l.status <> 'removed'
          AND CONCAT(l.make, ' ', l.model) ILIKE $1
      ) suggestions
      WHERE suggestion IS NOT NULL
        AND suggestion <> ''
      ORDER BY suggestion ASC
      LIMIT $2
    `,
    [pattern, limit],
  );

  return {
    items: result.rows.map((row) => row.suggestion),
  };
}