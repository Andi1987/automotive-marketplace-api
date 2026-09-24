-- Change fuel type from "petrol" to "bensin".

ALTER TABLE listings
    DROP CONSTRAINT IF EXISTS listings_fuel_type_check;

UPDATE listings
SET fuel_type = 'bensin'
WHERE fuel_type = 'petrol';

ALTER TABLE listings
    ADD CONSTRAINT listings_fuel_type_check
    CHECK (
        fuel_type IN (
            'bensin',
            'diesel',
            'hybrid',
            'electric'
        )
    );