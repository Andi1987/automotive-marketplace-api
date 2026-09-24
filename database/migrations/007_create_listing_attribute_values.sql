CREATE TABLE IF NOT EXISTS listing_attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID NOT NULL,
    attribute_id UUID NOT NULL,

    option_id UUID NULL,

    value_text TEXT NULL,
    value_number NUMERIC(14, 4) NULL,
    value_boolean BOOLEAN NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT listing_attribute_values_listing_id_fkey
        FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE,

    CONSTRAINT listing_attribute_values_attribute_id_fkey
        FOREIGN KEY (attribute_id)
        REFERENCES filter_attributes(id)
        ON DELETE CASCADE,

    CONSTRAINT listing_attribute_values_option_id_fkey
        FOREIGN KEY (option_id)
        REFERENCES filter_attribute_options(id)
        ON DELETE CASCADE,

    CONSTRAINT listing_attribute_values_unique
        UNIQUE (listing_id, attribute_id),

    CONSTRAINT listing_attribute_values_value_check
        CHECK (
            option_id IS NOT NULL
            OR value_text IS NOT NULL
            OR value_number IS NOT NULL
            OR value_boolean IS NOT NULL
        )
);

CREATE INDEX IF NOT EXISTS idx_listing_attribute_values_listing_id
    ON listing_attribute_values (listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_attribute_values_attribute_id
    ON listing_attribute_values (attribute_id);

CREATE INDEX IF NOT EXISTS idx_listing_attribute_values_option_id
    ON listing_attribute_values (option_id);

CREATE INDEX IF NOT EXISTS idx_listing_attribute_values_number
    ON listing_attribute_values (
        attribute_id,
        value_number
    );

CREATE INDEX IF NOT EXISTS idx_listing_attribute_values_boolean
    ON listing_attribute_values (
        attribute_id,
        value_boolean
    );