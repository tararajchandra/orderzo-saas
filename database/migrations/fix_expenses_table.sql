
-- Add missing columns to expenses table if they don't exist
DO $$
BEGIN
    BEGIN
        ALTER TABLE expenses ADD COLUMN expense_date DATE NOT NULL DEFAULT CURRENT_DATE;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE expenses ADD COLUMN receipt_image_id INTEGER REFERENCES images(id) ON DELETE SET NULL;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE expenses ADD COLUMN notes TEXT;
    EXCEPTION
        WHEN duplicate_column THEN NULL;
    END;
END $$;
