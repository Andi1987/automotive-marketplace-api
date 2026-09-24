CREATE TABLE IF NOT EXISTS filter_attribute_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    attribute_id UUID NOT NULL,

    value VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT filter_attribute_options_attribute_id_fkey
        FOREIGN KEY (attribute_id)
        REFERENCES filter_attributes(id)
        ON DELETE CASCADE,

    CONSTRAINT filter_attribute_options_sort_order_check
        CHECK (sort_order >= 0),

    CONSTRAINT filter_attribute_options_attribute_value_unique
        UNIQUE (attribute_id, value)
);

CREATE INDEX IF NOT EXISTS idx_filter_attribute_options_attribute_id
    ON filter_attribute_options (attribute_id);