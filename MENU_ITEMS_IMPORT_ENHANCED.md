# Menu Items Import - Enhanced (Dec 12, 2025)

## Issue: 500 Error During Import

### Problem
Server returned 500 error when importing menu items.

### Root Cause
The exported menu items contain both `category_id` and `category_name`. When importing into a different database or after re-creating the database, the `category_id` values don't match because IDs are auto-generated.

### Solution Applied

#### Enhanced Category Lookup
The import now intelligently uses `category_name` to look up the correct `category_id`:

```typescript
// If category_name is provided, look up the category_id
let categoryId = item.category_id;
if (item.category_name && item.category_name.trim() !== '') {
    const categoryResult = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [item.category_name]
    );
    if (categoryResult.rows.length > 0) {
        categoryId = categoryResult.rows[0].id;
    }
}
```

**Benefits:**
- ✅ Imports work across different databases
- ✅ Category IDs are automatically resolved
- ✅ More portable and reliable

#### Improved Error Logging
Enhanced error messages show:
- Which specific item failed
- The complete item data
- Detailed error message

## How It Works

### Export Format
```json
{
  "name": "MANCHOW SOUP",
  "description": "Spicy vegetable soup",
  "category_id": 6,
  "category_name": "SOUP VEG",  // ← Used for lookup!
  "price": "80.00",
  "gst_rate": "5.00",
  "available": true
}
```

### Import Process
1. **Check if `category_name` exists** in the item
2. **Look up the category** by name in the database
3. **Get the correct `category_id`** from the lookup
4. **Use that ID** for the menu item insert/update
5. **Fallback to `category_id`** if no category_name provided

### Example Scenario

**Scenario**: You export from Database A and import to Database B

**Database A:**
- Category "SOUP VEG" has ID = 6

**Database B (fresh):**
- Category "SOUP VEG" has ID = 2 (different!)

**Without Enhancement:**
- ❌ Import fails or creates orphaned items

**With Enhancement:**
- ✅ Looks up "SOUP VEG" → finds ID = 2
- ✅ Uses ID = 2 for the menu item
- ✅ Import succeeds!

## Troubleshooting

### If Import Still Fails

1. **Check Server Console**
   Look for messages like:
   ```
   Error importing item "MANCHOW SOUP": <error details>
   Item data: { ... full item data ... }
   ```

2. **Common Issues:**

   **Missing Category:**
   ```
   Category not found: SOUP VEG for item: MANCHOW SOUP
   ```
   **Solution**: Import categories first!

   **Invalid Data:**
   ```
   Failed to import "MANCHOW SOUP": invalid input syntax for type numeric
   ```
   **Solution**: Check price/gst_rate format

   **Duplicate Name:**
   ```
   Failed to import "MANCHOW SOUP": duplicate key value violates unique constraint
   ```
   **Solution**: Item already exists (this is OK, it will update)

3. **Run Diagnostic Script**
   ```bash
   node scripts/diagnose-import.js ./menu_items_2025-12-12.json menu_items
   ```

## Import Order (Critical!)

**Always import in this order:**

1. **Categories FIRST** ← Required!
   ```
   Import categories_2025-12-12.json
   ✅ 29 imported, 0 skipped
   ```

2. **Menu Items SECOND** ← After categories exist
   ```
   Import menu_items_2025-12-12.json
   ✅ 207 imported, 0 skipped
   ```

## Expected Results

### Success Response
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

### Partial Success (Some Skipped)
```json
{
  "success": true,
  "message": "Import completed: 203 imported, 4 skipped",
  "details": {
    "imported": 203,
    "skipped": 4,
    "total": 207,
    "errors": [
      "Failed to import \"ITEM_NAME\": error details..."
    ]
  }
}
```

## Testing Checklist

- [ ] Categories imported successfully (29 items)
- [ ] Menu items import attempted
- [ ] Check server console for errors
- [ ] All 207 menu items imported
- [ ] Verify items appear in admin panel
- [ ] Verify items have correct categories

## Need Help?

If you still get a 500 error:

1. **Share the server console output** - Look for "Error importing item" messages
2. **Share the error response** - Copy the full error from browser console
3. **Run the diagnostic script** - Validate your import file
4. **Check the import order** - Categories must be imported first!

---
**Status**: Enhanced ✅  
**Last Updated**: December 12, 2025 17:05 IST
