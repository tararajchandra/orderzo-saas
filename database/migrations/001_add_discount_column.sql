-- ============================================
-- Migration: Add discount column to orders table
-- Date: 2024-12-17
-- Description: Adds discount column to support manual discounts
-- ============================================

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'discount'
    ) THEN
        -- Add discount column
        ALTER TABLE orders 
        ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
        
        RAISE NOTICE 'Successfully added discount column to orders table';
    ELSE
        RAISE NOTICE 'Discount column already exists in orders table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'discount';

-- ============================================
-- END OF MIGRATION
-- ============================================
