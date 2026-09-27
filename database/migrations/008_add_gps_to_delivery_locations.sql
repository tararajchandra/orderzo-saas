-- Migration: Add GPS coordinates and radius to delivery_locations table
-- Purpose: Enable GPS-based automatic delivery zone detection

-- Add GPS coordinate columns
ALTER TABLE delivery_locations 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS radius_km DECIMAL(5, 2) DEFAULT 5.00;

-- Add comments for clarity
COMMENT ON COLUMN delivery_locations.latitude IS 'GPS latitude coordinate for zone center';
COMMENT ON COLUMN delivery_locations.longitude IS 'GPS longitude coordinate for zone center';
COMMENT ON COLUMN delivery_locations.radius_km IS 'Delivery zone radius in kilometers (default: 5km)';

-- Update existing locations with sample coordinates (Delhi NCR area)
-- Note: Admins should update these with actual coordinates for their delivery zones

UPDATE delivery_locations SET 
    latitude = 28.6139, 
    longitude = 77.2090, 
    radius_km = 3.0 
WHERE location_name = 'City Center';

UPDATE delivery_locations SET 
    latitude = 28.7041, 
    longitude = 77.1025, 
    radius_km = 5.0 
WHERE location_name = 'North Zone';

UPDATE delivery_locations SET 
    latitude = 28.5355, 
    longitude = 77.3910, 
    radius_km = 5.0 
WHERE location_name = 'South Zone';

UPDATE delivery_locations SET 
    latitude = 28.6692, 
    longitude = 77.4538, 
    radius_km = 6.0 
WHERE location_name = 'East Zone';

UPDATE delivery_locations SET 
    latitude = 28.6692, 
    longitude = 77.0892, 
    radius_km = 6.0 
WHERE location_name = 'West Zone';

UPDATE delivery_locations SET 
    latitude = 28.4595, 
    longitude = 77.0266, 
    radius_km = 8.0 
WHERE location_name = 'Suburbs';

UPDATE delivery_locations SET 
    latitude = 28.5562, 
    longitude = 77.1000, 
    radius_km = 10.0 
WHERE location_name = 'Airport Area';

-- Create index for faster GPS queries
CREATE INDEX IF NOT EXISTS idx_delivery_locations_gps ON delivery_locations(latitude, longitude);
