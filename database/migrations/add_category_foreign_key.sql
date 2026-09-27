-- Migration: Add category_id foreign key to menu_items table
-- This migration converts the category VARCHAR field to a foreign key reference

-- Step 1: Add the new category_id column (nullable initially)
ALTER TABLE menu_items 
ADD COLUMN category_id INTEGER;

-- Step 2: Populate category_id by matching existing category names with categories table
UPDATE menu_items m
SET category_id = c.id
FROM categories c
WHERE m.category = c.name;

-- Step 3: Handle any menu items with categories that don't exist in the categories table
-- Insert missing categories first
INSERT INTO categories (name, description, sort_order)
SELECT DISTINCT m.category, 'Auto-migrated category', 999
FROM menu_items m
WHERE m.category_id IS NULL
ON CONFLICT (name) DO NOTHING;

-- Step 4: Update any remaining NULL category_id values
UPDATE menu_items m
SET category_id = c.id
FROM categories c
WHERE m.category = c.name AND m.category_id IS NULL;

-- Step 5: Make category_id NOT NULL now that all values are populated
ALTER TABLE menu_items 
ALTER COLUMN category_id SET NOT NULL;

-- Step 6: Add foreign key constraint
ALTER TABLE menu_items
ADD CONSTRAINT fk_menu_items_category
FOREIGN KEY (category_id) REFERENCES categories(id)
ON DELETE RESTRICT;

-- Step 7: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- Step 8: Drop the old category column
ALTER TABLE menu_items 
DROP COLUMN category;

-- Step 9: Update the existing index (remove old one if it exists)
DROP INDEX IF EXISTS idx_menu_items_category;
