CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    seller_id UUID NOT NULL,
    category_id UUID NOT NULL,

    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,

    year SMALLINT NOT NULL,
    mileage INTEGER NOT NULL DEFAULT 0,
    price NUMERIC(14, 2) NOT NULL,

    condition VARCHAR(30) NOT NULL,
    transmission VARCHAR(30) NOT NULL,
    fuel_type VARCHAR(30) NOT NULL,

    color VARCHAR(50) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'available',

    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(
            to_tsvector(
                'simple',
                COALESCE(make, '')
            ),
            'A'
        )
        ||
        setweight(
            to_tsvector(
                'simple',
                COALESCE(model, '')
            ),
            'A'
        )
        ||
        setweight(
            to_tsvector(
                'simple',
                COALESCE(description, '')
            ),
            'B'
        )
        ||
        setweight(
            to_tsvector(
                'simple',
                COALESCE(location, '')
            ),
            'C'
        )
    ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT listings_seller_id_fkey
        FOREIGN KEY (seller_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT listings_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    CONSTRAINT listings_year_check
        CHECK (year >= 1900),

    CONSTRAINT listings_mileage_check
        CHECK (mileage >= 0),

    CONSTRAINT listings_price_check
        CHECK (price >= 0),

    CONSTRAINT listings_condition_check
        CHECK (condition IN ('new', 'used')),

    CONSTRAINT listings_transmission_check
        CHECK (
            transmission IN (
                'automatic',
                'manual',
                'cvt'
            )
        ),

    CONSTRAINT listings_fuel_type_check
        CHECK (
            fuel_type IN (
                'petrol',
                'diesel',
                'hybrid',
                'electric'
            )
        ),

    CONSTRAINT listings_status_check
        CHECK (
            status IN (
                'available',
                'pending',
                'sold',
                'removed'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_listings_seller_id
    ON listings (seller_id);

CREATE INDEX IF NOT EXISTS idx_listings_category_id
    ON listings (category_id);

CREATE INDEX IF NOT EXISTS idx_listings_status
    ON listings (status);

CREATE INDEX IF NOT EXISTS idx_listings_created_at
    ON listings (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_listings_category_status_created_at
    ON listings (
        category_id,
        status,
        created_at DESC,
        id DESC
    );

CREATE INDEX IF NOT EXISTS idx_listings_search_vector
    ON listings
    USING GIN (search_vector);