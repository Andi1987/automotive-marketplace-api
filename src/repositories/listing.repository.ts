import { pool } from "../config/database";

export interface Listing {
  id: string;
  seller_id: string;
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

  status: "available" | "pending" | "sold" | "removed";

  created_at: Date;
  updated_at: Date;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  image_url: string;
  sort_order: number;
  created_at: Date;
}

export interface ListingAttributeValue {
  id: string;
  listing_id: string;
  attribute_id: string;
  option_id: string | null;
  value_text: string | null;
  value_number: string | null;
  value_boolean: boolean | null;
  created_at: Date;
}

export interface CreateListingInput {
  category_id: string;

  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;

  condition: string;
  transmission: string;
  fuel_type: string;

  color: string;
  location: string;
  description?: string | null;

  status?: "available" | "pending" | "sold";

  images?: string[];
}

export async function createListing(
  input: CreateListingInput,
): Promise<Listing> {
  const result = await pool.query<Listing>(
    `
      INSERT INTO listings (
        seller_id,
        category_id,
        make,
        model,
        year,
        mileage,
        price,
        condition,
        transmission,
        fuel_type,
        color,
        location,
        description,
        status
      )
      VALUES (
        NULL,
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13
      )
      RETURNING
        id,
        seller_id,
        category_id,
        make,
        model,
        year,
        mileage,
        price,
        condition,
        transmission,
        fuel_type,
        color,
        location,
        description,
        status,
        created_at,
        updated_at
    `,
    [
      input.category_id,
      input.make,
      input.model,
      input.year,
      input.mileage,
      input.price,
      input.condition,
      input.transmission,
      input.fuel_type,
      input.color,
      input.location,
      input.description ?? null,
      input.status ?? "available",
    ],
  );

  return result.rows[0];
}

export interface UpdateListingInput {
  category_id?: string;

  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  price?: number;

  condition?: string;
  transmission?: string;
  fuel_type?: string;

  color?: string;
  location?: string;
  description?: string | null;

  status?: "available" | "pending" | "sold";
}

export interface ListingCursor {
  created_at: string;
  id: string;
}

export interface ListingPage {
  listings: Listing[];
  nextCursor: string | null;
}

export interface ListingFilters {
  limit: number;

  category_id?: string;
  make?: string;
  model?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  condition?: string;
  transmission?: string;
  fuel_type?: string;
  color?: string;
}

export interface ListingRepositoryFilters {
  limit: number;

  cursor?: ListingCursor;

  category_id?: string;
  make?: string;
  model?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  condition?: string;
  transmission?: string;
  fuel_type?: string;
  color?: string;
}

export async function findListingById(
  id: string,
): Promise<Listing | null> {
  const result = await pool.query<Listing>(
    `
      SELECT
        id,
        seller_id,
        category_id,
        make,
        model,
        year,
        mileage,
        price,
        condition,
        transmission,
        fuel_type,
        color,
        location,
        description,
        status,
        created_at,
        updated_at
      FROM listings
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findListingImages(
  listingId: string,
): Promise<ListingImage[]> {
  const result = await pool.query<ListingImage>(
    `
      SELECT
        id,
        listing_id,
        image_url,
        sort_order,
        created_at
      FROM listing_images
      WHERE listing_id = $1
      ORDER BY sort_order ASC, id ASC
    `,
    [listingId],
  );

  return result.rows;
}

export async function findListingAttributes(
  listingId: string,
): Promise<ListingAttributeValue[]> {
  const result = await pool.query<ListingAttributeValue>(
    `
      SELECT
        id,
        listing_id,
        attribute_id,
        option_id,
        value_text,
        value_number,
        value_boolean,
        created_at
      FROM listing_attribute_values
      WHERE listing_id = $1
      ORDER BY attribute_id ASC
    `,
    [listingId],
  );

  return result.rows;
}

interface ListingRow extends Listing {
  cursor_created_at: string;
}

export async function findListings(
  filters: ListingRepositoryFilters,
): Promise<ListingPage> {
  const safeLimit = Math.min(
    Math.max(filters.limit, 1),
    100,
  );

  const conditions: string[] = [
    "status <> 'removed'",
  ];

  const values: unknown[] = [];

  const addValue = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  /*
   * Static filters
   */

  if (filters.make) {
    const parameter = addValue(filters.make);

    conditions.push(`
      make ILIKE '%' || ${parameter} || '%'
    `);
  }

  if (filters.model) {
    const parameter = addValue(filters.model);

    conditions.push(`
      model ILIKE '%' || ${parameter} || '%'
    `);
  }

  if (filters.min_price !== undefined) {
    const parameter = addValue(filters.min_price);

    conditions.push(`
      price >= ${parameter}
    `);
  }

  if (filters.max_price !== undefined) {
    const parameter = addValue(filters.max_price);

    conditions.push(`
      price <= ${parameter}
    `);
  }

  if (filters.min_year !== undefined) {
    const parameter = addValue(filters.min_year);

    conditions.push(`
      year >= ${parameter}
    `);
  }

  if (filters.max_year !== undefined) {
    const parameter = addValue(filters.max_year);

    conditions.push(`
      year <= ${parameter}
    `);
  }

  if (filters.condition) {
    const parameter = addValue(filters.condition);

    conditions.push(`
      condition = ${parameter}
    `);
  }

  if (filters.transmission) {
    const parameter = addValue(filters.transmission);

    conditions.push(`
      transmission = ${parameter}
    `);
  }

  if (filters.fuel_type) {
    const parameter = addValue(filters.fuel_type);

    conditions.push(`
      fuel_type = ${parameter}
    `);
  }

  if (filters.color) {
    const parameter = addValue(filters.color);

    conditions.push(`
      color ILIKE '%' || ${parameter} || '%'
    `);
  }

  if (filters.category_id) {
    const parameter = addValue(filters.category_id);

    conditions.push(`
      category_id = ${parameter}
    `);
  }

  /*
   * Cursor pagination.
   *
   * IMPORTANT:
   * created_at is kept as PostgreSQL text with microsecond
   * precision so the cursor remains stable across pages.
   */

  if (filters.cursor) {
    const createdAtParameter = addValue(
      filters.cursor.created_at,
    );

    const idParameter = addValue(
      filters.cursor.id,
    );

    conditions.push(`
      (
        created_at < ${createdAtParameter}::timestamptz
        OR (
          created_at =
            ${createdAtParameter}::timestamptz
          AND id < ${idParameter}
        )
      )
    `);
  }

  const limitParameter = addValue(
    safeLimit + 1,
  );

  const query = `
    SELECT
      id,
      seller_id,
      category_id,
      make,
      model,
      year,
      mileage,
      price,
      condition,
      transmission,
      fuel_type,
      color,
      location,
      description,
      status,
      created_at,
      updated_at,
      created_at::text AS cursor_created_at
    FROM listings
    WHERE ${conditions.join("\n      AND ")}
    ORDER BY created_at DESC, id DESC
    LIMIT ${limitParameter}
  `;

  const result = await pool.query<ListingRow>(
    query,
    values,
  );

  const hasNextPage =
    result.rows.length > safeLimit;

  const rows = hasNextPage
    ? result.rows.slice(0, safeLimit)
    : result.rows;

  const listings: Listing[] = rows.map(
    (row) => ({
      id: row.id,
      seller_id: row.seller_id,
      category_id: row.category_id,
      make: row.make,
      model: row.model,
      year: row.year,
      mileage: row.mileage,
      price: row.price,
      condition: row.condition,
      transmission: row.transmission,
      fuel_type: row.fuel_type,
      color: row.color,
      location: row.location,
      description: row.description,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  );

  const lastListing =
    rows[rows.length - 1];

  const nextCursor =
    hasNextPage && lastListing
      ? encodeCursor({
          created_at:
            lastListing.cursor_created_at,
          id: lastListing.id,
        })
      : null;

  return {
    listings,
    nextCursor,
  };
}

export async function updateListing(
  id: string,
  input: UpdateListingInput,
): Promise<Listing | null> {
  const fields: string[] = [];
  const values: unknown[] = [id];

  if (input.category_id !== undefined) {
    fields.push(
      `category_id = $${values.length + 1}`,
    );
    values.push(input.category_id);
  }

  if (input.make !== undefined) {
    fields.push(
      `make = $${values.length + 1}`,
    );
    values.push(input.make);
  }

  if (input.model !== undefined) {
    fields.push(
      `model = $${values.length + 1}`,
    );
    values.push(input.model);
  }

  if (input.year !== undefined) {
    fields.push(
      `year = $${values.length + 1}`,
    );
    values.push(input.year);
  }

  if (input.mileage !== undefined) {
    fields.push(
      `mileage = $${values.length + 1}`,
    );
    values.push(input.mileage);
  }

  if (input.price !== undefined) {
    fields.push(
      `price = $${values.length + 1}`,
    );
    values.push(input.price);
  }

  if (input.condition !== undefined) {
    fields.push(
      `condition = $${values.length + 1}`,
    );
    values.push(input.condition);
  }

  if (input.transmission !== undefined) {
    fields.push(
      `transmission = $${values.length + 1}`,
    );
    values.push(input.transmission);
  }

  if (input.fuel_type !== undefined) {
    fields.push(
      `fuel_type = $${values.length + 1}`,
    );
    values.push(input.fuel_type);
  }

  if (input.color !== undefined) {
    fields.push(
      `color = $${values.length + 1}`,
    );
    values.push(input.color);
  }

  if (input.location !== undefined) {
    fields.push(
      `location = $${values.length + 1}`,
    );
    values.push(input.location);
  }

  if (input.description !== undefined) {
    fields.push(
      `description = $${values.length + 1}`,
    );
    values.push(input.description);
  }

  if (input.status !== undefined) {
    fields.push(
      `status = $${values.length + 1}`,
    );
    values.push(input.status);
  }

  if (fields.length === 0) {
    return findListingById(id);
  }

  fields.push("updated_at = NOW()");

  const result = await pool.query<Listing>(
    `
      UPDATE listings
      SET ${fields.join(", ")}
      WHERE id = $1
        AND status <> 'removed'
      RETURNING
        id,
        seller_id,
        category_id,
        make,
        model,
        year,
        mileage,
        price,
        condition,
        transmission,
        fuel_type,
        color,
        location,
        description,
        status,
        created_at,
        updated_at
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function softDeleteListing(
  id: string,
): Promise<Listing | null> {
  const result = await pool.query<Listing>(
    `
      UPDATE listings
      SET
        status = 'removed',
        updated_at = NOW()
      WHERE id = $1
        AND status <> 'removed'
      RETURNING
        id,
        seller_id,
        category_id,
        make,
        model,
        year,
        mileage,
        price,
        condition,
        transmission,
        fuel_type,
        color,
        location,
        description,
        status,
        created_at,
        updated_at
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function createListingImages(
  listingId: string,
  images: string[],
): Promise<ListingImage[]> {
  if (images.length === 0) {
    return [];
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertedImages: ListingImage[] = [];

    for (
      let index = 0;
      index < images.length;
      index++
    ) {
      const result =
        await client.query<ListingImage>(
          `
            INSERT INTO listing_images (
              listing_id,
              image_url,
              sort_order
            )
            VALUES ($1, $2, $3)
            RETURNING
              id,
              listing_id,
              image_url,
              sort_order,
              created_at
          `,
          [
            listingId,
            images[index],
            index,
          ],
        );

      insertedImages.push(result.rows[0]);
    }

    await client.query("COMMIT");

    return insertedImages;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function replaceListingImages(
  listingId: string,
  images: string[],
): Promise<ListingImage[]> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        DELETE FROM listing_images
        WHERE listing_id = $1
      `,
      [listingId],
    );

    const insertedImages: ListingImage[] = [];

    for (
      let index = 0;
      index < images.length;
      index++
    ) {
      const result =
        await client.query<ListingImage>(
          `
            INSERT INTO listing_images (
              listing_id,
              image_url,
              sort_order
            )
            VALUES ($1, $2, $3)
            RETURNING
              id,
              listing_id,
              image_url,
              sort_order,
              created_at
          `,
          [
            listingId,
            images[index],
            index,
          ],
        );

      insertedImages.push(result.rows[0]);
    }

    await client.query("COMMIT");

    return insertedImages;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function encodeCursor(
  cursor: ListingCursor,
): string {
  const payload = JSON.stringify({
    created_at: cursor.created_at,
    id: cursor.id,
  });

  return Buffer.from(
    payload,
    "utf8",
  ).toString("base64url");
}

export function decodeCursor(
  cursor: string,
): ListingCursor {
  const decoded = Buffer.from(
    cursor,
    "base64url",
  ).toString("utf8");

  const payload = JSON.parse(decoded) as {
    created_at?: unknown;
    id?: unknown;
  };

  if (
    typeof payload.created_at !== "string" ||
    typeof payload.id !== "string"
  ) {
    throw new Error("Invalid cursor");
  }

  const createdAt = new Date(
    payload.created_at,
  );

  if (Number.isNaN(createdAt.getTime())) {
    throw new Error("Invalid cursor");
  }

  return {
    created_at: payload.created_at,
    id: payload.id,
  };
}