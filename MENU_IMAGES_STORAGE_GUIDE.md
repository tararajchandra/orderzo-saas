# 🖼️ Menu Item Images - Storage Guide

## Yes! Menu Items Store Images in Two Ways

Your Ruchi system has **two methods** for storing menu item images:

---

## 📊 Method 1: Direct Binary Storage (Primary Method)

### **menu_items** Table Fields:

```sql
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER,
    price DECIMAL(10, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) DEFAULT 5.00,
    
    -- IMAGE STORAGE FIELDS
    image_data BYTEA,           -- Stores actual image as binary data
    image_type VARCHAR(50),     -- Stores image MIME type (e.g., 'image/jpeg', 'image/png')
    
    available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### How It Works:
- **image_data (BYTEA)**: Stores the actual image file as binary data in the database
- **image_type (VARCHAR)**: Stores the image format/MIME type

### Advantages:
✅ Images stored directly in database  
✅ No external file management needed  
✅ Automatic backup with database backup  
✅ Transactional integrity  
✅ Easy to export/import with data  

### Disadvantages:
⚠️ Increases database size  
⚠️ Slower queries if many large images  
⚠️ Base64 encoding needed for display  

---

## 📊 Method 2: URL Reference Storage (Alternative Method)

### **images** Table:

```sql
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,        -- URL or file path to image
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### How It Works:
- Stores **URL or file path** to image (not the image itself)
- Supports **multiple images per menu item**
- Can mark one image as **primary**

### Advantages:
✅ Smaller database size  
✅ Faster database queries  
✅ Multiple images per item  
✅ Can use CDN or external storage  
✅ Easier to update images  

### Disadvantages:
⚠️ Need to manage image files separately  
⚠️ Broken links if files deleted  
⚠️ Separate backup needed for images  

---

## 🎯 Current Implementation

### Your system uses **BOTH methods**:

1. **Primary Storage**: `menu_items.image_data` (BYTEA)
   - Used for the main menu item image
   - Stored as binary in database

2. **Additional Images**: `images` table
   - Used for extra product photos
   - Stored as URLs/paths
   - Supports image galleries

---

## 💻 How Images Are Handled in Code

### Uploading Images (Admin Panel)

When you upload an image through the admin panel:

```typescript
// The image is converted to binary and stored in menu_items table
const imageBuffer = await file.arrayBuffer();
const imageData = Buffer.from(imageBuffer);

await query(
  `INSERT INTO menu_items (name, price, image_data, image_type, ...)
   VALUES ($1, $2, $3, $4, ...)`,
  [name, price, imageData, file.type, ...]
);
```

### Retrieving Images (Display)

When displaying images:

```typescript
// Image is retrieved as binary data
const result = await query('SELECT image_data, image_type FROM menu_items WHERE id = $1', [id]);

// Convert to base64 for display in browser
const base64Image = result.rows[0].image_data.toString('base64');
const imageUrl = `data:${result.rows[0].image_type};base64,${base64Image}`;

// Use in HTML: <img src={imageUrl} alt="Menu Item" />
```

---

## 📁 Database Storage Details

### BYTEA (Binary Data) Type

**What is BYTEA?**
- PostgreSQL data type for storing binary data
- Can store any type of file (images, PDFs, etc.)
- Maximum size: 1 GB per field (but recommended < 1 MB for images)

**Storage Format:**
```
Raw Binary → Database BYTEA → Base64 (for display)
```

**Example:**
```sql
-- Insert image
INSERT INTO menu_items (name, image_data, image_type)
VALUES ('Paneer Tikka', '\x89504e470d0a1a0a...', 'image/png');

-- Retrieve image
SELECT image_data, image_type FROM menu_items WHERE id = 1;
```

---

## 🔍 Checking Image Storage

### SQL Query to Check Images:

```sql
-- Count menu items with images
SELECT 
    COUNT(*) as total_items,
    COUNT(image_data) as items_with_images,
    COUNT(*) - COUNT(image_data) as items_without_images
FROM menu_items;

-- Get image details
SELECT 
    id,
    name,
    CASE 
        WHEN image_data IS NOT NULL THEN 'Has Image'
        ELSE 'No Image'
    END as image_status,
    image_type,
    octet_length(image_data) as image_size_bytes,
    pg_size_pretty(octet_length(image_data)) as image_size_readable
FROM menu_items
ORDER BY id;

-- Find large images (> 500 KB)
SELECT 
    id,
    name,
    pg_size_pretty(octet_length(image_data)) as image_size
FROM menu_items
WHERE octet_length(image_data) > 500000
ORDER BY octet_length(image_data) DESC;
```

---

## 📊 Image Storage Statistics

### Check Total Database Size Used by Images:

```sql
-- Total size of all images in menu_items
SELECT 
    pg_size_pretty(SUM(octet_length(image_data))) as total_image_size
FROM menu_items
WHERE image_data IS NOT NULL;

-- Average image size
SELECT 
    pg_size_pretty(AVG(octet_length(image_data))::bigint) as avg_image_size
FROM menu_items
WHERE image_data IS NOT NULL;

-- Size breakdown by category
SELECT 
    c.name as category,
    COUNT(m.id) as item_count,
    COUNT(m.image_data) as images_count,
    pg_size_pretty(SUM(octet_length(m.image_data))) as total_size
FROM menu_items m
LEFT JOIN categories c ON m.category_id = c.id
GROUP BY c.name
ORDER BY SUM(octet_length(m.image_data)) DESC;
```

---

## 🎨 Image Format Support

### Supported Image Types:

| Format | MIME Type | Extension | Recommended |
|--------|-----------|-----------|-------------|
| JPEG | image/jpeg | .jpg, .jpeg | ✅ Yes (best compression) |
| PNG | image/png | .png | ✅ Yes (transparency support) |
| WebP | image/webp | .webp | ✅ Yes (modern, efficient) |
| GIF | image/gif | .gif | ⚠️ Limited (no animation) |
| BMP | image/bmp | .bmp | ❌ No (too large) |

### Recommended Image Specifications:

```
Format: JPEG or WebP
Size: 800x600 pixels (or similar aspect ratio)
File Size: < 200 KB (optimized)
Quality: 80-85% (good balance)
Color Space: RGB
```

---

## 🔧 Working with Images

### Adding Image to Menu Item:

**Via Admin Panel:**
1. Go to Admin → Menu → Add New Item
2. Fill in item details
3. Click "Choose File" for image
4. Select image from computer
5. Click Save
6. ✅ Image stored as BYTEA in database

**Via API:**
```typescript
// Upload endpoint
POST /api/menu
Content-Type: multipart/form-data

FormData:
  - name: "Paneer Tikka"
  - price: 250
  - image: [File object]
```

### Retrieving Image:

**Via API:**
```typescript
// Get menu item with image
GET /api/menu/1

Response:
{
  id: 1,
  name: "Paneer Tikka",
  price: 250,
  image_data: "base64encodedstring...",
  image_type: "image/jpeg"
}
```

**Display in Frontend:**
```tsx
<img 
  src={`data:${item.image_type};base64,${item.image_data}`}
  alt={item.name}
/>
```

---

## 📤 Export/Import with Images

### Current Export Behavior:

**⚠️ Important:** The current export/import does **NOT** include image_data!

**Export Query (current):**
```sql
SELECT 
    id, name, description, category_id, 
    category_name, price, gst_rate, 
    available, created_at, updated_at
FROM menu_items
-- Note: image_data and image_type are NOT included
```

**Why?**
- Binary data is difficult to export to CSV/JSON
- Large file sizes
- Base64 encoding needed

### Solution for Image Backup:

**Option 1: Export Images Separately**
```sql
-- Export image data as base64
SELECT 
    id,
    name,
    encode(image_data, 'base64') as image_base64,
    image_type
FROM menu_items
WHERE image_data IS NOT NULL;
```

**Option 2: Use Database Backup**
```bash
# Full database backup includes images
pg_dump restaurant_db > backup_with_images.sql

# Restore with images
psql restaurant_db < backup_with_images.sql
```

**Option 3: Export Images to Files**
```sql
-- PostgreSQL COPY command
COPY (
    SELECT id, image_data 
    FROM menu_items 
    WHERE image_data IS NOT NULL
) TO '/path/to/images/';
```

---

## 🎯 Best Practices

### Image Optimization:

1. **Resize Before Upload**
   - Max dimensions: 1200x900 pixels
   - Recommended: 800x600 pixels

2. **Compress Images**
   - Use tools like TinyPNG, ImageOptim
   - Target: < 200 KB per image

3. **Use Appropriate Format**
   - Photos: JPEG or WebP
   - Graphics/Logos: PNG
   - Avoid: BMP, TIFF

4. **Lazy Loading**
   - Load images only when needed
   - Use placeholders for better UX

### Database Maintenance:

```sql
-- Find items without images
SELECT id, name 
FROM menu_items 
WHERE image_data IS NULL;

-- Remove orphaned images (images table)
DELETE FROM images 
WHERE menu_item_id NOT IN (SELECT id FROM menu_items);

-- Vacuum to reclaim space after deleting images
VACUUM FULL menu_items;
```

---

## 📋 Summary

### ✅ Yes, menu_items holds images!

**Storage Method:**
- **Primary**: `image_data` (BYTEA) - Binary storage in database
- **Secondary**: `images` table - URL/path references

**Fields:**
- `image_data` → Actual image as binary
- `image_type` → MIME type (image/jpeg, image/png, etc.)

**How to Check:**
```sql
SELECT 
    name, 
    CASE WHEN image_data IS NOT NULL THEN 'Yes' ELSE 'No' END as has_image,
    image_type,
    pg_size_pretty(octet_length(image_data)) as size
FROM menu_items;
```

**Backup:**
- Use `pg_dump` for complete backup including images
- Export/Import currently doesn't include images (by design)
- Can export images separately if needed

---

## 🔗 Related Files

- Database Schema: `database/schema.sql`
- Menu API: `app/api/menu/route.ts`
- Image API: `app/api/images/[id]/route.ts`
- Admin Menu: `app/admin/menu/page.tsx`

---

**Last Updated:** December 12, 2025  
**Version:** 2.0
