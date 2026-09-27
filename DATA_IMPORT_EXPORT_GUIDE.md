# Data Import/Export - Complete Guide

## Quick Start: Import All Menu Items with Categories

### Step 1: Export Your Data (Fresh Export)
1. Go to **Admin Dashboard** → **Data Import/Export**
2. Export **Categories** first (JSON format)
3. Export **Menu Items** (JSON format)

The new export format is **import-ready** - no manual editing needed!

### Step 2: Import in Correct Order
**⚠️ IMPORTANT: Always import in this order:**

1. **Import Categories FIRST**
   - Go to Data Import/Export
   - Select "Categories" as data type
   - Upload your `categories_YYYY-MM-DD.json` file
   - Click Import
   - ✅ All 29 categories should import successfully

2. **Import Menu Items SECOND**
   - Select "Menu Items" as data type
   - Upload your `menu_items_YYYY-MM-DD.json` file
   - Click Import
   - ✅ All 207 menu items should import successfully

### Why This Order Matters
Menu items reference categories via `category_id`. If categories don't exist, menu items will fail to import.

## What Changed (December 12, 2025)

### Export Improvements
✅ **Removed unnecessary fields** from exports:
- No more `id` field (auto-generated on import)
- No more `created_at` / `updated_at` (auto-managed)
- Only fields that exist in the database schema are exported

✅ **Export files are now directly importable** - no manual editing required!

### Import Behavior

#### Categories
- **Unique constraint**: Category `name` must be unique
- **On duplicate**: Updates existing category with new data
- **All fields**: name, description, sort_order

#### Menu Items
- **Unique constraint**: Menu item `name` must be unique
- **On duplicate**: Updates existing item with new data
- **Required fields**: name, price
- **Optional fields**: description, category_id, gst_rate, available, image_data_base64, image_type
- **Image handling**: Base64 encoded images are automatically decoded

#### Delivery Locations
- **Unique constraint**: `location_name` must be unique
- **On duplicate**: Updates existing location

#### Users/Salesmen/Delivery Boys
- **Unique constraint**: `email` or `phone` must be unique
- **On duplicate**: Skips the record (doesn't update)

## Troubleshooting

### "Only 4 items imported, others skipped"

**Common causes:**

1. **❌ Wrong import order**
   - Solution: Import categories before menu items

2. **❌ Old export format with extra fields**
   - Solution: Re-export using the updated export feature

3. **❌ Duplicate names in import file**
   - Solution: Check for duplicates using the diagnostic script

4. **❌ Invalid category_id references**
   - Solution: Ensure all category IDs in menu items exist in categories

5. **❌ Missing required fields**
   - Solution: Ensure `name` and `price` are present for menu items

### Using the Diagnostic Script

Run this before importing to check for issues:

```bash
node scripts/diagnose-import.js <file-path> <data-type>
```

**Examples:**
```bash
# Check categories
node scripts/diagnose-import.js ./categories_2025-12-12.json categories

# Check menu items
node scripts/diagnose-import.js ./menu_items_2025-12-12.json menu_items
```

The script will show:
- ✅ Valid records (will import)
- ❌ Invalid records (will be skipped with reasons)
- ⚠️ Warnings (duplicates, unknown fields)

## Import Response Format

After import, you'll see:

```json
{
  "success": true,
  "message": "Import completed: 207 imported, 0 skipped",
  "details": {
    "imported": 207,
    "skipped": 0,
    "total": 207,
    "errors": []
  }
}
```

If items are skipped, check the `errors` array for details.

## Data Format Reference

### Categories (JSON)
```json
[
  {
    "name": "SOUP VEG",
    "description": "Vegetarian soups",
    "sort_order": 1
  }
]
```

### Menu Items (JSON)
```json
[
  {
    "name": "MANCHOW SOUP",
    "description": "Spicy vegetable soup",
    "category_id": 6,
    "price": "80.00",
    "gst_rate": "5.00",
    "available": true,
    "image_data_base64": "",
    "image_type": "image/jpeg"
  }
]
```

**Notes:**
- `category_id` must exist in categories table
- `price` and `gst_rate` can be strings or numbers
- `available` can be: `true`, `false`, `"true"`, `"false"`, `"1"`, `"0"`
- `image_data_base64` is optional (leave empty string if no image)

### Delivery Locations (JSON)
```json
[
  {
    "location_name": "Downtown",
    "delivery_charge": "50.00",
    "is_active": true
  }
]
```

## CSV Format Support

CSV files are also supported. Example:

**categories.csv:**
```csv
name,description,sort_order
SOUP VEG,Vegetarian soups,1
SOUP NON VEG,Non-vegetarian soups,2
```

**menu_items.csv:**
```csv
name,description,category_id,price,gst_rate,available
MANCHOW SOUP,Spicy vegetable soup,6,80.00,5.00,true
HOT AND SOUR SOUP,Tangy soup,6,80.00,5.00,true
```

## Best Practices

1. **Always backup before import**
   - Export current data before importing new data
   - Keep backups in the `backup/` folder

2. **Test with small datasets first**
   - Try importing 2-3 records first
   - Verify they import correctly
   - Then import the full dataset

3. **Use the diagnostic script**
   - Validate files before uploading
   - Fix any errors identified

4. **Import in correct order**
   - Categories → Menu Items → Delivery Locations → Users

5. **Check the response**
   - Review the import summary
   - Check error messages if any items are skipped

## Migration from Old Export Files

If you have old export files (with `id`, `created_at`, `updated_at` fields):

**Option 1: Re-export (Recommended)**
- Simply re-export the data using the updated export feature

**Option 2: Manual cleanup**
- Remove `id`, `created_at`, `updated_at` fields from JSON
- For categories, ensure `is_active` field exists
- For menu items, `category_name` field is ignored (only `category_id` is used)

## Need Help?

- Check server console for detailed error messages
- Run the diagnostic script to validate your data
- Ensure you're importing in the correct order
- Verify all required fields are present
- Check that foreign key references (like `category_id`) are valid
