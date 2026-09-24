import { pool } from "../config/database";

export interface FilterAttribute {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  type: "enum" | "range" | "boolean";
  is_filterable: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FilterAttributeOption {
  id: string;
  attribute_id: string;
  value: string;
  label: string;
  sort_order: number;
  created_at: Date;
}

export interface FilterAttributeWithOptions extends FilterAttribute {
  options: FilterAttributeOption[];
}

export async function findAllFilterAttributes(): Promise<
  FilterAttributeWithOptions[]
> {
  const attributesResult = await pool.query<FilterAttribute>(
    `
      SELECT
        id,
        category_id,
        name,
        slug,
        type,
        is_filterable,
        created_at,
        updated_at
      FROM filter_attributes
      WHERE is_filterable = TRUE
      ORDER BY category_id, name ASC
    `,
  );

  if (attributesResult.rows.length === 0) {
    return [];
  }

  const attributeIds = attributesResult.rows.map((attribute) => attribute.id);

  const optionsResult = await pool.query<FilterAttributeOption>(
    `
      SELECT
        id,
        attribute_id,
        value,
        label,
        sort_order,
        created_at
      FROM filter_attribute_options
      WHERE attribute_id = ANY($1::uuid[])
      ORDER BY attribute_id, sort_order ASC, label ASC
    `,
    [attributeIds],
  );

  const optionsByAttribute = new Map<string, FilterAttributeOption[]>();

  for (const option of optionsResult.rows) {
    const existing = optionsByAttribute.get(option.attribute_id) ?? [];
    existing.push(option);
    optionsByAttribute.set(option.attribute_id, existing);
  }

  return attributesResult.rows.map((attribute) => ({
    ...attribute,
    options: optionsByAttribute.get(attribute.id) ?? [],
  }));
}

export async function findFilterAttributesByCategoryId(
  categoryId: string,
): Promise<FilterAttributeWithOptions[]> {
  const attributesResult = await pool.query<FilterAttribute>(
    `
      SELECT
        id,
        category_id,
        name,
        slug,
        type,
        is_filterable,
        created_at,
        updated_at
      FROM filter_attributes
      WHERE category_id = $1
        AND is_filterable = TRUE
      ORDER BY name ASC
    `,
    [categoryId],
  );

  if (attributesResult.rows.length === 0) {
    return [];
  }

  const attributeIds = attributesResult.rows.map((attribute) => attribute.id);

  const optionsResult = await pool.query<FilterAttributeOption>(
    `
      SELECT
        id,
        attribute_id,
        value,
        label,
        sort_order,
        created_at
      FROM filter_attribute_options
      WHERE attribute_id = ANY($1::uuid[])
      ORDER BY attribute_id, sort_order ASC, label ASC
    `,
    [attributeIds],
  );

  const optionsByAttribute = new Map<string, FilterAttributeOption[]>();

  for (const option of optionsResult.rows) {
    const existing = optionsByAttribute.get(option.attribute_id) ?? [];
    existing.push(option);
    optionsByAttribute.set(option.attribute_id, existing);
  }

  return attributesResult.rows.map((attribute) => ({
    ...attribute,
    options: optionsByAttribute.get(attribute.id) ?? [],
  }));
}