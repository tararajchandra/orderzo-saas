# Import Templates

This folder contains sample templates for importing data into the RuchiV2 system.

## Available Templates

### JSON Templates
- `menu_items_template.json` - Sample menu items data
- `categories_template.json` - Sample categories data
- `delivery_locations_template.json` - Sample delivery locations data

### CSV Templates
- `menu_items_template.csv` - Sample menu items in CSV format

## Quick Start

### ⚠️ IMPORTANT: Import Order Matters!

**Always import in this order:**
1. **Categories FIRST** (menu items depend on these)
2. **Menu Items SECOND** (after categories exist)
3. Delivery Locations (optional)
4. Users (optional)

### How to Use

1. **Export your current data** from Admin Dashboard → Data Import/Export
   - The exported files are now **directly importable** (no editing needed!)
2. **Or download a template** from this folder and edit with your data
3. **Ensure all required fields** are filled in
4. **Go to Admin Dashboard** → Data Import/Export
5. **Select the data type** matching your file
6. **Upload your file** and click Import

## Important Notes

- **Categories must be imported before menu items** (menu items reference category_id)
- For JSON files, maintain the array structure `[{...}, {...}]`
- For CSV files, keep the header row intact
- Required fields must not be empty
- For menu items, ensure category_id exists in the categories table
- Boolean values should be `true` or `false` (not 1/0)
- Decimal values should use dot notation (e.g., `250.00` not `250,00`)
- The new export format excludes `id`, `created_at`, and `updated_at` fields

## Troubleshooting

**"Only 4 items imported, others skipped"?**

Common causes:
1. ❌ Imported menu items before categories
2. ❌ Using old export format with extra fields
3. ❌ Duplicate names in your file
4. ❌ Invalid category_id references
5. ❌ Missing required fields

**Solution:** 
- Re-export your data (new format is import-ready)
- Import categories first, then menu items
- Use the diagnostic script: `node scripts/diagnose-import.js <file> <type>`

## Need Help?

Refer to the comprehensive guide: **`DATA_IMPORT_EXPORT_GUIDE.md`** in the project root for:
- Detailed import instructions
- Data format requirements
- Field descriptions
- Import behavior
- Troubleshooting tips
- Diagnostic script usage
