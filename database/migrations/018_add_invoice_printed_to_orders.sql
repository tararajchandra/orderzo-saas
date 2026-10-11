-- Migration: Add invoice_printed column to the orders table
-- Version: 018
-- Added on: 2026-10-11

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'invoice_printed') THEN
        ALTER TABLE orders ADD COLUMN invoice_printed BOOLEAN DEFAULT false;
    END IF;
END $$;
