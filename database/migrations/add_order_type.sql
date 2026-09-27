-- Migration script to add order_type field to existing orders table
-- Run this if you already have the database set up

-- Add order_type column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'delivery';

-- Make customer_address nullable for takeaway orders
ALTER TABLE orders 
ALTER COLUMN customer_address DROP NOT NULL;

-- Update existing orders to have 'delivery' as default order_type
UPDATE orders 
SET order_type = 'delivery' 
WHERE order_type IS NULL;

-- Add comment to the column
COMMENT ON COLUMN orders.order_type IS 'Order type: takeaway or delivery';
COMMENT ON COLUMN orders.customer_address IS 'Customer address - optional for takeaway orders';
