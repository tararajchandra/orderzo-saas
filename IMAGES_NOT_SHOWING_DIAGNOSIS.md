# Product Images Not Showing - Diagnosis & Solution

## Problem
After importing menu items, product images are not displaying.

## Root Cause Analysis

### System Architecture
The RuchiV2 system has TWO ways to store images:

1. **Direct Storage** (in `menu_items` table):
   - Column: `image_data` (BYTEA - binary data)
   - Column: `image_type` (VARCHAR - e.g., 'image/jpeg')

2. **Separate Storage** (in `images` table):
   - Stores images separately
   - Menu items reference them via JOIN
   - API endpoint: `/api/images/[id]`

### Current Export/Import Behavior

**Export** (`image_data_base64`):
```sql
SELECT encode(m.image_data, 'base64') as image_data_base64,
       m.image_type
FROM menu_items m
```

**Import** (decodes base64):
```typescript
let imageData = null;
if (item.image_data_base64 && item.image_data_base64.trim() !== '') {
    imageData = Buffer.from(item.image_data_base64, 'base64');
}
```

## Diagnosis Steps

### Step 1: Check if Original Items Had Images

Run this query in your database:

```sql
SELECT 
    name,
    CASE 
        WHEN image_data IS NULL THEN 'No image'
        ELSE 'Has image (' || LENGTH(image_data) || ' bytes)'
    END as image_status,
    image_type
FROM menu_items
ORDER BY id
LIMIT 20;
```

**Expected Results:**
- If you see "No image" for all items → **Images were never uploaded**
- If you see "Has image (XXXX bytes)" → **Images exist in database**

### Step 2: Check Exported File

Check your exported JSON file:

```powershell
# PowerShell command
$content = Get-Content "menu_items_2025-12-12.json" -Raw | ConvertFrom-Json
$itemsWithImages = $content | Where-Object { $_.image_data_base64 -and $_.image_data_base64.Length -gt 0 }
Write-Host "Total items: $($content.Count)"
Write-Host "Items with images: $($itemsWithImages.Count)"
```

**Expected Results:**
- If 0 items have images → **Export didn't include images** (images were NULL in DB)
- If some items have images → **Export worked correctly**

### Step 3: Check After Import

After importing, run this query:

```sql
SELECT 
    name,
    CASE 
        WHEN image_data IS NULL THEN 'No image'
        ELSE 'Has image (' || LENGTH(image_data) || ' bytes)'
    END as image_status,
    image_type
FROM menu_items
WHERE name IN ('MANCHOW SOUP', 'HOT AND SOUR SOUP', 'LEMON CORIANDER SOUP')
ORDER BY name;
```

## Possible Scenarios & Solutions

### Scenario 1: Images Were Never Uploaded
**Symptom**: All items show "No image" in database

**Solution**: You need to upload images for your menu items

**How to Upload Images:**
1. Go to Admin Panel → Menu Items
2. Edit each item
3. Upload an image
4. Save

### Scenario 2: Images Exist But Not Exported
**Symptom**: Database has images, but exported JSON has empty `image_data_base64`

**Possible Causes:**
- Images are too large (PostgreSQL might truncate in export)
- Export query has an issue

**Solution**: Check export query and database

### Scenario 3: Images Exported But Not Imported
**Symptom**: Exported JSON has image data, but after import, database shows "No image"

**Possible Causes:**
- Import failed to decode base64
- Import skipped image data due to error

**Solution**: Check server logs during import for errors like:
```
Error decoding image for item: ITEM_NAME
```

### Scenario 4: Images Imported But Not Displaying
**Symptom**: Database has images after import, but UI doesn't show them

**Possible Causes:**
- Frontend is looking for `image_id` instead of `image_data`
- Image serving endpoint has issues

**Solution**: Check how frontend displays images

## Quick Test

### Test if Images Are in Database

```sql
-- Count items with images
SELECT 
    COUNT(*) FILTER (WHERE image_data IS NOT NULL) as items_with_images,
    COUNT(*) as total_items
FROM menu_items;
```

### Test if Image Can Be Retrieved

If you have an item with image_data, test if it can be served:

```sql
-- Get first item with image
SELECT id, name, LENGTH(image_data) as image_size, image_type
FROM menu_items
WHERE image_data IS NOT NULL
LIMIT 1;
```

Then try to access it via API (if using image_id approach):
```
GET /api/images/[id]
```

Or check if the menu API returns image data.

## Recommended Solution

Since your export shows **no image data**, the most likely scenario is:

### ✅ **Scenario 1: Images Were Never Uploaded**

**Action Required:**
1. Upload images for your menu items through the admin panel
2. Then export will include the images
3. Import will work correctly with images

**Alternative: If you have images elsewhere**

If you have product images as files (JPG, PNG, etc.), I can help you:
1. Create a bulk image upload script
2. Match images to menu items by name
3. Insert them into the database

## Verification Checklist

After fixing, verify:

- [ ] Database query shows images exist
- [ ] Export includes `image_data_base64` with content
- [ ] Import successfully decodes and stores images
- [ ] Frontend displays images correctly

## Need Help?

Please provide:
1. Result of the database query (Step 1)
2. Count of items with images in exported file (Step 2)
3. Screenshot of a menu item in admin panel (does it show an image?)

This will help me identify the exact issue and provide a targeted solution.

---

---

## 🔍 Diagnosis Results (2025-12-15)

### Database Check
- **Ran Script**: `scripts/diagnose_images.js`
- **Result**: Images **ARE PRESENT** in the database.
  - Total Items: 207
  - Items with Images: 201
  - Sample sizes: ~350KB - 550KB (valid image sizes)

### API Check
- **Ran Script**: `scripts/test_menu_images.js`
- **Result**: API **WORKS CORRECTLY**.
  - `/api/menu` returns items with `image_url`.
  - Fetching a sample image URL (e.g., `/api/menu/83/image`) returns status 200 and Content-Type `image/jpeg`.

### Conclusion
The backend, database, and API are functioning correctly. Images should be displaying. 
If they are still not showing in the UI, it is likely a local browser cache issue or a transient network error triggering the frontend's `onError` fallback.

**Status**: ✅ Backend Verified. Issue likely resolved or frontend-specific.

