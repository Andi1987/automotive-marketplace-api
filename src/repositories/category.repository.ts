import { pool } from "../config/database";

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCategoryInput {
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
}

export interface UpdateCategoryInput {
  parent_id?: string | null;
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface CategoryTreeNode extends Category {
  depth: number;
}

export async function findAllCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(
    `
      SELECT
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM categories
      ORDER BY
        parent_id NULLS FIRST,
        name ASC
    `,
  );

  return result.rows;
}

export async function findCategoryById(
  id: string,
): Promise<Category | null> {
  const result = await pool.query<Category>(
    `
      SELECT
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM categories
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  const result = await pool.query<Category>(
    `
      SELECT
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM categories
      WHERE slug = $1
      LIMIT 1
    `,
    [slug],
  );

  return result.rows[0] ?? null;
}

export async function findChildrenByParentId(
  parentId: string,
): Promise<Category[]> {
  const result = await pool.query<Category>(
    `
      SELECT
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
      FROM categories
      WHERE parent_id = $1
      ORDER BY name ASC
    `,
    [parentId],
  );

  return result.rows;
}

export async function findCategoryTree(): Promise<
  CategoryTreeNode[]
> {
  const result = await pool.query<CategoryTreeNode>(
    `
      WITH RECURSIVE category_tree AS (
        SELECT
          id,
          parent_id,
          name,
          slug,
          description,
          is_active,
          created_at,
          updated_at,
          0 AS depth
        FROM categories
        WHERE parent_id IS NULL

        UNION ALL

        SELECT
          child.id,
          child.parent_id,
          child.name,
          child.slug,
          child.description,
          child.is_active,
          child.created_at,
          child.updated_at,
          parent.depth + 1
        FROM categories child
        INNER JOIN category_tree parent
          ON child.parent_id = parent.id
      )

      SELECT
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at,
        depth
      FROM category_tree
      ORDER BY
        depth ASC,
        name ASC
    `,
  );

  return result.rows;
}

export async function findCategoryDescendants(
  categoryId: string,
): Promise<CategoryTreeNode[]> {
  const result = await pool.query<CategoryTreeNode>(
    `
      WITH RECURSIVE category_tree AS (
        SELECT
          id,
          parent_id,
          name,
          slug,
          description,
          is_active,
          created_at,
          updated_at,
          0 AS depth
        FROM categories
        WHERE id = $1

        UNION ALL

        SELECT
          child.id,
          child.parent_id,
          child.name,
          child.slug,
          child.description,
          child.is_active,
          child.created_at,
          child.updated_at,
          parent.depth + 1
        FROM categories child
        INNER JOIN category_tree parent
          ON child.parent_id = parent.id
      )

      SELECT
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at,
        depth
      FROM category_tree
      ORDER BY
        depth ASC,
        name ASC
    `,
    [categoryId],
  );

  return result.rows;
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Category> {
  const result = await pool.query<Category>(
    `
      INSERT INTO categories (
        parent_id,
        name,
        slug,
        description,
        is_active
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      RETURNING
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
    `,
    [
      input.parent_id ?? null,
      input.name,
      input.slug,
      input.description ?? null,
      input.is_active ?? true,
    ],
  );

  return result.rows[0];
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category | null> {
  const fields: string[] = [];
  const values: unknown[] = [id];

  if (input.parent_id !== undefined) {
    fields.push(`parent_id = $${values.length + 1}`);
    values.push(input.parent_id);
  }

  if (input.name !== undefined) {
    fields.push(`name = $${values.length + 1}`);
    values.push(input.name);
  }

  if (input.slug !== undefined) {
    fields.push(`slug = $${values.length + 1}`);
    values.push(input.slug);
  }

  if (input.description !== undefined) {
    fields.push(`description = $${values.length + 1}`);
    values.push(input.description);
  }

  if (input.is_active !== undefined) {
    fields.push(`is_active = $${values.length + 1}`);
    values.push(input.is_active);
  }

  if (fields.length === 0) {
    return findCategoryById(id);
  }

  fields.push("updated_at = NOW()");

  const result = await pool.query<Category>(
    `
      UPDATE categories
      SET
        ${fields.join(", ")}
      WHERE id = $1
      RETURNING
        id,
        parent_id,
        name,
        slug,
        description,
        is_active,
        created_at,
        updated_at
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function hasChildren(
  categoryId: string,
): Promise<boolean> {
  const result = await pool.query<{ exists: boolean }>(
    `
      SELECT EXISTS (
        SELECT 1
        FROM categories
        WHERE parent_id = $1
      ) AS exists
    `,
    [categoryId],
  );

  return result.rows[0]?.exists ?? false;
}