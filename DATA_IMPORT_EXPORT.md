# Data Import/Export Feature

## Overview
The Data Import/Export feature allows administrators to backup, restore, and migrate data across the RuchiV2 restaurant management system. This feature supports multiple data types and file formats.

## Features

### Supported Data Types
1. **Menu Items** - All menu items with categories, prices, and GST rates
2. **Categories** - Menu categories with display order
3. **Delivery Locations** - Delivery zones with charges
4. **Users (Customers)** - Customer accounts and information
5. **Salesmen** - Sales staff with commission settings
6. **Delivery Boys** - Delivery staff with commission settings
7. **Orders** - Order history (export only for backup)

### Supported Formats
- **JSON** - Structured data format, best for complete backups
- **CSV** - Spreadsheet format, easy to edit in Excel/Google Sheets

## How to Use

### Exporting Data

1. Navigate to **Admin Dashboard** → **Data Import/Export**
2. In the **Export Data** section:
   - Select the data type you want to export
   - Choose the format (JSON or CSV)
   - For orders, optionally filter by date range
   - Click **Download Export**
3. The file will be downloaded to your computer

### Importing Data

1. Navigate to **Admin Dashboard** → **Data Import/Export**
2. In the **Import Data** section:
   - Select the data type you want to import
   - Click **Choose File** and select your JSON or CSV file
   - Click **Upload & Import**
3. Review the import results (imported, skipped, errors)

## Data Format Requirements

### Menu Items
**Required Fields:**
- `name` - Item name (unique)
- `price` - Item price

**Optional Fields:**
- `description` - Item description
- `category_id` - Category ID (must exist in categories table)
- `gst_rate` - GST rate (0-100)
- `available` - true/false

**Example JSON:**
```json
[
  {
    "name": "Paneer Tikka",
    "description": "Grilled cottage cheese",
    "category_id": 1,
    "price": 250.00,
    "gst_rate": 5,
    "available": true
  }
]
```

**Example CSV:**
```csv
name,description,category_id,price,gst_rate,available
Paneer Tikka,Grilled cottage cheese,1,250.00,5,true
Chicken Biryani,Aromatic rice with chicken,2,350.00,5,true
```

### Categories
**Required Fields:**
- `name` - Category name (unique)

**Optional Fields:**
- `description` - Category description
- `sort_order` - Display order (number)

**Example JSON:**
```json
[
  {
    "name": "Appetizers",
    "description": "Starters and snacks",
    "sort_order": 1
  }
]
```

### Delivery Locations
**Required Fields:**
- `location_name` - Location name (unique)
- `delivery_charge` - Delivery charge amount

**Optional Fields:**
- `is_active` - true/false (default: true)

**Example JSON:**
```json
[
  {
    "location_name": "City Center",
    "delivery_charge": 30.00,
    "is_active": true
  }
]
```

### Users (Customers)
**Required Fields:**
- `email` - Email address (unique)
- `name` - Customer name

**Optional Fields:**
- `phone` - Phone number
- `address` - Delivery address

**Example JSON:**
```json
[
  {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main St, City"
  }
]
```

### Salesmen / Delivery Boys
**Required Fields:**
- `name` - Staff name
- `phone` - Phone number (unique)

**Optional Fields:**
- `email` - Email address
- `commission_rate` - Commission rate (number)
- `commission_type` - "percentage" or "fixed"
- `is_active` - true/false

**Example JSON:**
```json
[
  {
    "name": "Rajesh Kumar",
    "phone": "9876543210",
    "email": "rajesh@example.com",
    "commission_rate": 5,
    "commission_type": "percentage",
    "is_active": true
  }
]
```

## Import Behavior

### Duplicate Handling
- **Menu Items**: Updates existing items with the same name
- **Categories**: Updates existing categories with the same name
- **Delivery Locations**: Updates existing locations with the same name
- **Users/Salesmen/Delivery Boys**: Skips if email or phone already exists

### Transaction Safety
- All imports are wrapped in database transactions
- If any error occurs, the entire import is rolled back
- No partial imports - it's all or nothing

### Validation
- Required fields are validated
- Data types are checked (numbers, booleans, etc.)
- Foreign key relationships are verified
- Invalid records are skipped and reported

## Best Practices

### Before Importing
1. **Backup First**: Always export current data before importing
2. **Validate Format**: Ensure your file matches the required format
3. **Test with Small Dataset**: Try importing a few records first
4. **Check Dependencies**: For menu items, ensure categories exist first

### Regular Backups
1. **Daily Backups**: Export orders daily for record-keeping
2. **Weekly Backups**: Export all data types weekly
3. **Before Updates**: Always backup before major changes
4. **Store Safely**: Keep backups in multiple locations

### Data Migration
1. Export data from source system
2. Transform data to match required format
3. Import categories first
4. Then import menu items
5. Finally import users and other data

## Troubleshooting

### Import Fails
- **Check file format**: Ensure JSON is valid or CSV is properly formatted
- **Verify required fields**: All required fields must be present
- **Check data types**: Numbers should be numbers, booleans should be true/false
- **Review error messages**: The system provides detailed error information

### Partial Import
- The system reports how many records were imported vs skipped
- Check the error details for specific issues
- Fix the problematic records and re-import

### Export Issues
- **Empty export**: Ensure the selected data type has records
- **Date range**: For orders, verify the date range includes orders
- **Browser issues**: Try a different browser if download fails

## API Endpoints

### Export
```
GET /api/admin/data-management/export?type={type}&format={format}
```

**Parameters:**
- `type`: menu_items, categories, delivery_locations, users, salesmen, delivery_boys, orders
- `format`: json, csv
- `startDate`: (optional, for orders) YYYY-MM-DD
- `endDate`: (optional, for orders) YYYY-MM-DD

### Import
```
POST /api/admin/data-management/import
```

**Body (multipart/form-data):**
- `file`: JSON or CSV file
- `type`: Data type to import

## Security Considerations

1. **Admin Only**: This feature is only accessible to admin users
2. **Authentication**: Requires valid admin token
3. **Validation**: All imported data is validated before insertion
4. **Transaction Safety**: Database transactions prevent partial imports
5. **Error Logging**: All errors are logged for security auditing

## Future Enhancements

Potential improvements for future versions:
- Scheduled automatic backups
- Cloud storage integration (Google Drive, Dropbox)
- Import preview before committing
- Data transformation tools
- Bulk update capabilities
- Import history and rollback
- Excel (.xlsx) format support
- Data validation rules customization

## Support

For issues or questions about the import/export feature:
1. Check this documentation first
2. Review error messages carefully
3. Test with sample data
4. Contact system administrator if issues persist
