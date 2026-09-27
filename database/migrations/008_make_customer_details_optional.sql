-- ============================================
-- MIGRATION: Make Customer Details Optional
-- ============================================
-- Purpose: Allow salesperson to create orders without customer details
-- for walk-in dine-in and takeaway orders
-- ============================================

-- Make customer_name and customer_phone nullable
ALTER TABLE orders 
ALTER COLUMN customer_name DROP NOT NULL,
ALTER COLUMN customer_phone DROP NOT NULL;

-- Add default values for better data quality
UPDATE orders 
SET customer_name = 'Walk-in Customer' 
WHERE customer_name IS NULL OR customer_name = '';

UPDATE orders 
SET customer_phone = 'N/A' 
WHERE customer_phone IS NULL OR customer_phone = '';

-- ============================================
-- END OF MIGRATION
-- ============================================
