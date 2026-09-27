# Quick Start Guide - Data Import/Export

## 🚀 Getting Started

### Access the Feature
1. Login to Admin Panel
2. Click on **"Data Import/Export"** card from the dashboard
3. Or navigate to: `http://localhost:3001/admin/data-management`

---

## 📤 Exporting Data

### Step-by-Step
1. **Select Data Type** from dropdown
   - Menu Items 🍽️
   - Categories 🏷️
   - Delivery Locations 📍
   - Users 👥
   - Salesmen 👨‍💼
   - Delivery Boys 🛵
   - Orders 📦

2. **Choose Format**
   - ○ JSON (recommended for backup)
   - ○ CSV (for Excel/Sheets)

3. **Optional: Filter Orders by Date**
   - Check "Filter by Date Range"
   - Select start and end dates

4. **Click "Download Export"**
   - File downloads automatically
   - Named: `{type}_{date}.{format}`

### When to Export
- ✅ Before making bulk changes
- ✅ Daily backup of orders
- ✅ Weekly backup of all data
- ✅ Before system updates
- ✅ For reporting purposes

---

## 📥 Importing Data

### Step-by-Step
1. **Prepare Your File**
   - Use templates from `database/import_templates/`
   - Or export existing data as template
   - Ensure correct format (JSON or CSV)

2. **Select Data Type** matching your file

3. **Choose File** 
   - Click "Choose File"
   - Select your .json or .csv file
   - File name appears when selected

4. **Click "Upload & Import"**
   - Wait for processing
   - Review import results

### Import Results
- ✅ **Imported**: Successfully added/updated
- ⏭️ **Skipped**: Duplicates or invalid data
- ❌ **Errors**: Problems with specific records

### Before Importing
- ⚠️ **ALWAYS backup first!**
- ✅ Validate file format
- ✅ Test with small dataset
- ✅ Check field requirements
- ✅ Ensure dependencies exist (e.g., categories before menu items)

---

## 📋 Quick Reference

### Menu Items
```json
{
  "name": "Item Name",          // Required, unique
  "description": "Description",  // Optional
  "category_id": 1,             // Optional, must exist
  "price": 250.00,              // Required
  "gst_rate": 5,                // Optional, 0-100
  "available": true             // Optional, true/false
}
```

### Categories
```json
{
  "name": "Category Name",      // Required, unique
  "description": "Description",  // Optional
  "display_order": 1            // Optional, number
}
```

### Delivery Locations
```json
{
  "location_name": "Location",  // Required, unique
  "delivery_charge": 30.00,     // Required
  "is_active": true             // Optional, true/false
}
```

---

## ⚡ Pro Tips

### For Exports
- 💡 Export in JSON for complete data preservation
- 💡 Use CSV for editing in Excel/Google Sheets
- 💡 Export orders with date range to reduce file size
- 💡 Keep multiple backup versions

### For Imports
- 💡 Start with categories, then menu items
- 💡 Test import with 2-3 records first
- 💡 Use templates as starting point
- 💡 Check for typos in boolean values (true/false)
- 💡 Ensure decimal numbers use dots, not commas

### Data Integrity
- 💡 Menu items need valid category_id
- 💡 Duplicate emails/phones are skipped for users
- 💡 Duplicate names update existing records for items/categories
- 💡 All imports use database transactions (safe rollback)

---

## 🆘 Troubleshooting

### Import Failed
**Problem**: "Failed to import data"
- ✅ Check file format (valid JSON or CSV)
- ✅ Ensure required fields are present
- ✅ Verify data types (numbers, booleans)
- ✅ Check for special characters

### Partial Import
**Problem**: Some records skipped
- ✅ Review error messages
- ✅ Check for duplicates
- ✅ Verify foreign key references
- ✅ Fix and re-import failed records

### Export Empty
**Problem**: Downloaded file is empty
- ✅ Ensure data exists for selected type
- ✅ Check date range (for orders)
- ✅ Try different browser
- ✅ Check browser download settings

---

## 🔒 Security Notes

- 🔐 Admin authentication required
- 🔐 All data validated before import
- 🔐 Transactions prevent partial imports
- 🔐 Errors are logged for auditing
- 🔐 Keep exported files secure (contains sensitive data)

---

## 📞 Need Help?

1. Check `DATA_IMPORT_EXPORT.md` for detailed documentation
2. Review sample templates in `database/import_templates/`
3. Test with small datasets first
4. Contact system administrator for assistance

---

## ✅ Checklist

### Before Exporting
- [ ] Know what data you need
- [ ] Choose appropriate format
- [ ] Set date range if needed
- [ ] Have storage space available

### Before Importing
- [ ] Backup current data
- [ ] Validate file format
- [ ] Check required fields
- [ ] Test with sample data
- [ ] Verify dependencies exist

### After Importing
- [ ] Review import results
- [ ] Check imported data in system
- [ ] Verify relationships (categories, etc.)
- [ ] Test functionality
- [ ] Keep import file for records

---

**Last Updated**: December 12, 2025
**Feature Version**: 1.0
**Compatible with**: RuchiV2
