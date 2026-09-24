CREATE TABLE IF NOT EXISTS filter_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,

    type VARCHAR(20) NOT NULL,

    is_filterable BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT filter_attributes_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,

    CONSTRAINT filter_attributes_type_check
        CHECK (
            type IN (
                'enum',
                'range',
                'boolean'
            )
        ),

    CONSTRAINT filter_attributes_category_slug_unique
        UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_filter_attributes_category_id
    ON filter_attributes (category_id);

CREATE INDEX IF NOT EXISTS idx_filter_attributes_filterable
    ON filter_attributes (
        category_id,
        is_filterable
    );