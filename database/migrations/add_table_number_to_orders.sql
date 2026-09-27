-- Add table_number to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_number VARCHAR(10);
