-- Add commission settings to users (for delivery boys)
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(10,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'fixed'; -- 'fixed' or 'percent'

-- Add commission amount to orders (to record earning per order)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS driver_commission DECIMAL(10,2) DEFAULT 0;
