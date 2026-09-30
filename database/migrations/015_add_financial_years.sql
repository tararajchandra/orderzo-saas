-- 1. Create financial_years table
CREATE TABLE IF NOT EXISTS financial_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert default financial years
INSERT INTO financial_years (name, start_date, end_date) 
VALUES 
    ('2023-24', '2023-04-01', '2024-03-31'),
    ('2024-25', '2024-04-01', '2025-03-31'),
    ('2025-26', '2025-04-01', '2026-03-31'),
    ('2026-27', '2026-04-01', '2027-03-31')
ON CONFLICT (name) DO NOTHING;

-- 3. Set current active financial year based on current date
UPDATE financial_years SET is_active = false;
UPDATE financial_years 
SET is_active = true 
WHERE CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date;

-- 4. Add financial_year_id to transactional tables (safely using DO blocks if needed, but IF NOT EXISTS is better for columns. PostgreSQL doesn't support IF NOT EXISTS on ADD COLUMN until v10, but Railway is modern)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='financial_year_id') THEN
        ALTER TABLE orders ADD COLUMN financial_year_id INTEGER REFERENCES financial_years(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='financial_year_id') THEN
        ALTER TABLE invoices ADD COLUMN financial_year_id INTEGER REFERENCES financial_years(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='financial_year_id') THEN
        ALTER TABLE expenses ADD COLUMN financial_year_id INTEGER REFERENCES financial_years(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payouts' AND column_name='financial_year_id') THEN
        ALTER TABLE payouts ADD COLUMN financial_year_id INTEGER REFERENCES financial_years(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Backfill financial_year_id for existing records
UPDATE orders o
SET financial_year_id = fy.id
FROM financial_years fy
WHERE DATE(o.created_at) >= fy.start_date AND DATE(o.created_at) <= fy.end_date
AND o.financial_year_id IS NULL;

UPDATE invoices i
SET financial_year_id = fy.id
FROM financial_years fy
WHERE DATE(i.generated_at) >= fy.start_date AND DATE(i.generated_at) <= fy.end_date
AND i.financial_year_id IS NULL;

UPDATE expenses e
SET financial_year_id = fy.id
FROM financial_years fy
WHERE DATE(e.created_at) >= fy.start_date AND DATE(e.created_at) <= fy.end_date
AND e.financial_year_id IS NULL;

UPDATE payouts p
SET financial_year_id = fy.id
FROM financial_years fy
WHERE DATE(p.created_at) >= fy.start_date AND DATE(p.created_at) <= fy.end_date
AND p.financial_year_id IS NULL;
