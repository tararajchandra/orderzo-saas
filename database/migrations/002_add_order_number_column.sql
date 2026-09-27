-- ============================================
-- Migration: Add order_number column to orders table
-- Date: 2024-12-17
-- Description: Adds order_number column for daily sequential numbering
-- ============================================

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_number'
    ) THEN
        -- Add order_number column
        ALTER TABLE orders 
        ADD COLUMN order_number VARCHAR(20) UNIQUE;
        
        RAISE NOTICE 'Successfully added order_number column to orders table';
    ELSE
        RAISE NOTICE 'order_number column already exists in orders table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'order_number';

-- ============================================
-- END OF MIGRATION
-- ============================================
