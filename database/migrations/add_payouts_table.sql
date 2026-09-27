-- Create payouts table to track payments to delivery boys
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    delivery_boy_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Link expenses to delivery boy payouts (optional, but good for tracking)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payout_id INTEGER REFERENCES payouts(id);

-- Ensure expense categories include 'Salary/Commission'
-- (This is usually handled in application logic, but good to note)
