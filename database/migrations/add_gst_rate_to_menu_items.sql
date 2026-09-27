-- Migration: Add GST rate to menu_items table
-- This allows different items to have different GST rates

-- Add gst_rate column to menu_items
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 5.00;

-- Update comment
COMMENT ON COLUMN menu_items.gst_rate IS 'GST rate in percentage (e.g., 5.00 for 5%, 12.00 for 12%, 18.00 for 18%)';

-- Common GST rates in India:
-- 0% - Basic food items (grains, milk, etc.)
-- 5% - Essential food items (sugar, tea, coffee, etc.)
-- 12% - Processed foods
-- 18% - Restaurant services, packaged foods
-- 28% - Luxury items

-- Update existing items with appropriate GST rates
-- You can customize these based on your menu
UPDATE menu_items SET gst_rate = 5.00 WHERE gst_rate IS NULL;
