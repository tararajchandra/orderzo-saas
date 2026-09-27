-- Migration: Add Delivery Locations Management
-- This migration adds support for delivery location management with delivery charges

-- Create delivery_locations table
CREATE TABLE IF NOT EXISTS delivery_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL UNIQUE,
    delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add delivery location fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_location_id INTEGER REFERENCES delivery_locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2) DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_locations_active ON delivery_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders(delivery_location_id);

-- Insert some sample delivery locations
INSERT INTO delivery_locations (location_name, delivery_charge, is_active) VALUES
('City Center', 30.00, true),
('North Zone', 50.00, true),
('South Zone', 50.00, true),
('East Zone', 60.00, true),
('West Zone', 60.00, true),
('Suburbs', 80.00, true),
('Airport Area', 100.00, true)
ON CONFLICT (location_name) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE delivery_locations IS 'Stores delivery locations with their respective delivery charges';
COMMENT ON COLUMN orders.delivery_location_id IS 'Reference to the delivery location for delivery orders';
COMMENT ON COLUMN orders.delivery_charge IS 'Delivery charge applied to the order based on location';
