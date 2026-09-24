CREATE TABLE IF NOT EXISTS listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID NOT NULL,

    image_url TEXT NOT NULL,

    sort_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT listing_images_listing_id_fkey
        FOREIGN KEY (listing_id)
        REFERENCES listings(id)
        ON DELETE CASCADE,

    CONSTRAINT listing_images_sort_order_check
        CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id
    ON listing_images (listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_images_listing_sort
    ON listing_images (
        listing_id,
        sort_order
    );