-- Migration: Add order_number field to orders table
-- Purpose: Implement daily sequential order numbering (resets each day)
-- Format: YYYYMMDD-XXX (e.g., 20251216-001, 20251216-002)

-- Add order_number column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Add comment
COMMENT ON COLUMN orders.order_number IS 'Daily sequential order number in format YYYYMMDD-XXX';
