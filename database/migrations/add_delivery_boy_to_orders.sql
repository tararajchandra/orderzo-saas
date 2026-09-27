-- Add delivery_boy_id to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_boy_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
