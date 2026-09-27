-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'Rent', 'Utilities', 'Salaries', 'Inventory', 'Maintenance'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50), -- 'cash', 'card', 'bank_transfer', 'upi'
    receipt_image_id INTEGER REFERENCES images(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster querying by date and category
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
