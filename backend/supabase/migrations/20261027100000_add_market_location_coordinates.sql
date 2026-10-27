ALTER TABLE public.market_locations
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.market_locations
  DROP CONSTRAINT IF EXISTS market_locations_coordinate_pair_check,
  ADD CONSTRAINT market_locations_coordinate_pair_check
    CHECK ((latitude IS NULL AND longitude IS NULL)
      OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
  DROP CONSTRAINT IF EXISTS market_locations_latitude_range_check,
  ADD CONSTRAINT market_locations_latitude_range_check
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  DROP CONSTRAINT IF EXISTS market_locations_longitude_range_check,
  ADD CONSTRAINT market_locations_longitude_range_check
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);
