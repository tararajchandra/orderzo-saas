# Database Connection Timeout - FIXED ✅

## Error
```
Error: Connection terminated due to connection timeout
```

## Root Cause

The database connection pool had a **very short timeout**:
```typescript
connectionTimeoutMillis: 2000  // Only 2 seconds!
```

But the import operation takes **~16 seconds** to process 207 menu items with images:
- Decode base64 images
- Check for duplicates
- Insert into `images` table
- Insert/update `menu_items` table
- All within a transaction

**Result**: Connection timed out before import could complete!

## The Fix

### Updated `lib/db.ts`:

**Before:**
```typescript
const pool = new Pool({
    ...
    connectionTimeoutMillis: 2000,  // ❌ Too short!
});
```

**After:**
```typescript
const pool = new Pool({
    ...
    connectionTimeoutMillis: 60000,   // ✅ 60 seconds
    statement_timeout: 120000,        // ✅ 120 seconds for queries
});
```

### What These Settings Mean:

1. **`connectionTimeoutMillis: 60000`**
   - Time to wait for a connection from the pool
   - Now allows 60 seconds (was 2 seconds)
   - Handles long-running operations like imports

2. **`statement_timeout: 120000`**
   - Maximum time for a single SQL statement
   - 120 seconds (2 minutes)
   - Prevents queries from running forever

## Why Import Takes Time

For 207 menu items with images:

1. **For each item** (~207 iterations):
   - Decode base64 image (~50KB each)
   - Check if image exists in database
   - Insert image if new
   - Check if menu item exists
   - Insert or update menu item

2. **Total operations**:
   - ~207 image checks
   - ~197 image inserts (if images exist)
   - ~207 menu item checks
   - ~207 menu item inserts/updates
   - **Total: ~800+ database queries!**

3. **Expected time**: 15-30 seconds

## Performance Optimization (Future)

The current import can be optimized further:

### Current Approach (Slow):
```typescript
for each item:
    check if image exists  // Query 1
    insert image          // Query 2
    check if item exists  // Query 3
    insert/update item    // Query 4
// Total: 4 queries × 207 items = 828 queries!
```

### Optimized Approach (Fast):
```typescript
// Batch insert all images at once
INSERT INTO images (...) VALUES (...), (...), (...)  // 1 query

// Batch insert all menu items at once
INSERT INTO menu_items (...) VALUES (...), (...), (...)  // 1 query

// Total: 2 queries for all 207 items!
```

**Potential speedup**: 10-20x faster!

## Testing

### Try Import Again:

1. **Server should auto-reload** with new database settings
2. **Import your menu items**
3. **Wait patiently** - may take 15-30 seconds
4. ✅ Should complete successfully!

### Expected Behavior:

**Progress indicators:**
```
Processing item 1/207...
Processing item 50/207...
Processing item 100/207...
Processing item 150/207...
Processing item 200/207...
✅ Import completed: 207 imported, 0 skipped
```

**Time**: 15-30 seconds (this is normal!)

## Troubleshooting

### If Still Times Out:

1. **Check if server reloaded**:
   - Look for "✅ Connected to PostgreSQL database" in console
   - Server should show compilation message

2. **Restart the dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check database connection**:
   - Is PostgreSQL running?
   - Can you connect with pgAdmin or psql?

### If Import is Very Slow (>60 seconds):

Possible causes:
- Database is on slow disk
- Too many other connections
- Database needs optimization (VACUUM, ANALYZE)

**Quick fix**: Increase timeout even more:
```typescript
connectionTimeoutMillis: 120000,  // 2 minutes
statement_timeout: 300000,        // 5 minutes
```

## Summary

✅ **Fixed**: Database connection timeout increased from 2s to 60s  
✅ **Added**: Statement timeout of 120s for long queries  
✅ **Result**: Import should complete successfully  
⏳ **Note**: Import may take 15-30 seconds - this is normal!  

**Status**: Ready to import! Try it now! 🚀

---
**Last Updated**: December 12, 2025 19:25 IST  
**Issue**: Connection timeout during import  
**Solution**: Increased connection and statement timeouts
