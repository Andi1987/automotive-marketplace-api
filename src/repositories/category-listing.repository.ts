import { pool } from "../config/database";

export interface CategoryListing {
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
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function findListingsByCategoryId(
  categoryId: string,
): Promise<CategoryListing[]> {
  const result =
    await pool.query<CategoryListing>(
      `
        WITH RECURSIVE category_tree AS (
          SELECT
            id
          FROM categories
          WHERE id = $1

          UNION ALL

          SELECT
            child.id
          FROM categories child
          INNER JOIN category_tree parent
            ON child.parent_id = parent.id
        )

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
        INNER JOIN category_tree ct
          ON ct.id = l.category_id
        WHERE l.status <> 'removed'
        ORDER BY
          l.created_at DESC,
          l.id DESC
      `,
      [categoryId],
    );

  return result.rows;
}