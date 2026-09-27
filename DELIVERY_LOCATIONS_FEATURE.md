# Delivery Location Management Feature

## Overview

This feature allows restaurant admins to manage delivery locations with customizable delivery charges. When customers place delivery orders, they can select from predefined delivery locations, and the appropriate delivery charge will be automatically applied to their order total.

## Features

### Admin Features
1. **Delivery Location Management**
   - Add new delivery locations with custom names and charges
   - Edit existing locations (name, charge, active status)
   - Activate/deactivate locations without deleting them
   - Delete unused locations (prevents deletion if used in orders)
   - View all locations in a clean table interface

2. **Order Management Integration**
   - Delivery location dropdown appears when creating delivery orders
   - Automatic delivery charge calculation based on selected location
   - Display delivery location and charge in order details
   - Location information shown in order list

### Customer Features
- Select delivery location when placing delivery orders
- See delivery charge before confirming order
- Delivery charge included in order total

## Database Schema

### New Table: `delivery_locations`
```sql
CREATE TABLE delivery_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL UNIQUE,
    delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Table: `orders`
```sql
ALTER TABLE orders 
ADD COLUMN delivery_location_id INTEGER REFERENCES delivery_locations(id),
ADD COLUMN delivery_charge DECIMAL(10, 2) DEFAULT 0;
```

## Installation & Setup

### 1. Run Database Migration

The migration has already been run, but if you need to run it again on a different environment:

```bash
node scripts/run_delivery_locations_migration.js
```

This will:
- Create the `delivery_locations` table
- Add delivery location fields to the `orders` table
- Insert sample delivery locations

### 2. Sample Data

The migration includes these sample locations:
- City Center - ₹30.00
- North Zone - ₹50.00
- South Zone - ₹50.00
- East Zone - ₹60.00
- West Zone - ₹60.00
- Suburbs - ₹80.00
- Airport Area - ₹100.00

## Usage Guide

### For Admins

#### Accessing Delivery Locations
1. Login to admin panel at `/admin`
2. Click on **"Delivery Locations"** card on the dashboard
3. Or navigate directly to `/admin/delivery-locations`

#### Adding a New Location
1. Click **"+ Add Location"** button
2. Enter location name (e.g., "Downtown Area")
3. Enter delivery charge (e.g., 45.00)
4. Check/uncheck "Active" status
5. Click **"Add Location"**

#### Editing a Location
1. Find the location in the table
2. Click **"✏️ Edit"** button
3. Modify the details
4. Click **"Update"**

#### Activating/Deactivating a Location
- Click on the status badge (Active/Inactive) to toggle
- Inactive locations won't appear in the order creation dropdown

#### Deleting a Location
1. Click **"🗑️ Delete"** button
2. Confirm deletion
3. Note: Cannot delete locations used in existing orders

#### Creating Orders with Delivery Locations
1. Go to **Orders** → **Create New Order**
2. Select **"Delivery"** as order type
3. Choose a delivery location from the dropdown
4. The delivery charge will automatically be added to the total
5. Complete the order as usual

### For Customers

When placing a delivery order:
1. Select items and add to cart
2. Choose "Delivery" as order type
3. Select your delivery location from the dropdown
4. Enter delivery address
5. Review the order total (includes delivery charge)
6. Complete the order

## API Endpoints

### Delivery Locations

#### GET `/api/admin/delivery-locations`
Fetch all delivery locations
- Query params: `?active=true` (optional, filter active only)
- Returns: Array of delivery locations

#### POST `/api/admin/delivery-locations`
Create a new delivery location
```json
{
  "location_name": "New Area",
  "delivery_charge": 50.00,
  "is_active": true
}
```

#### GET `/api/admin/delivery-locations/[id]`
Get a specific delivery location

#### PUT `/api/admin/delivery-locations/[id]`
Update a delivery location
```json
{
  "location_name": "Updated Name",
  "delivery_charge": 60.00,
  "is_active": false
}
```

#### DELETE `/api/admin/delivery-locations/[id]`
Delete a delivery location (fails if used in orders)

### Orders

The existing order endpoints have been updated to handle delivery locations:

#### POST `/api/orders`
Now accepts additional fields:
```json
{
  // ... existing fields
  "delivery_location_id": 1,
  "delivery_charge": 50.00
}
```

#### GET `/api/orders`
Now returns delivery location information:
```json
{
  "id": 1,
  // ... existing fields
  "delivery_location_id": 1,
  "delivery_charge": 50.00,
  "delivery_location_name": "City Center"
}
```

## File Structure

```
RuchiV2/
├── app/
│   ├── admin/
│   │   ├── delivery-locations/
│   │   │   └── page.tsx                    # Admin UI for managing locations
│   │   ├── orders/
│   │   │   ├── page.tsx                    # Updated to show location info
│   │   │   └── create/
│   │   │       └── page.tsx                # Updated with location dropdown
│   │   └── dashboard/
│   │       └── page.tsx                    # Added delivery locations link
│   └── api/
│       ├── admin/
│       │   └── delivery-locations/
│       │       ├── route.ts                # GET, POST endpoints
│       │       └── [id]/
│       │           └── route.ts            # GET, PUT, DELETE endpoints
│       └── orders/
│           └── route.ts                    # Updated to handle locations
├── database/
│   └── migrations/
│       └── 007_add_delivery_locations.sql  # Migration file
└── scripts/
    └── run_delivery_locations_migration.js # Migration runner
```

## Business Logic

### Delivery Charge Calculation
1. When order type is "Delivery", location selection is required
2. Delivery charge is fetched from the selected location
3. Total = Subtotal + Tax + Delivery Charge
4. Delivery charge is stored with the order for historical accuracy

### Location Status
- **Active**: Available for selection in new orders
- **Inactive**: Hidden from selection but preserved in existing orders
- **Deleted**: Only possible if not used in any orders

### Data Integrity
- Location names must be unique
- Delivery charges cannot be negative
- Orders maintain reference to location even if location is later modified
- Prevents deletion of locations used in orders

## Best Practices

1. **Don't Delete Active Locations**: Deactivate instead to preserve order history
2. **Regular Review**: Periodically review and update delivery charges based on distance/costs
3. **Clear Naming**: Use descriptive location names that customers will recognize
4. **Logical Pricing**: Set charges based on actual delivery distance/time
5. **Test Orders**: Create test orders to verify charge calculations

## Troubleshooting

### Location not appearing in dropdown
- Check if location is marked as "Active"
- Verify order type is set to "Delivery"
- Refresh the page

### Cannot delete location
- Location is being used in existing orders
- Deactivate it instead to hide from new orders

### Delivery charge not calculating
- Ensure location is selected before checking total
- Verify location has a valid delivery_charge value
- Check browser console for errors

## Future Enhancements

Potential improvements for this feature:
1. Distance-based automatic charge calculation
2. Time-based delivery charges (peak hours)
3. Minimum order value per location
4. Delivery time estimates per location
5. Geographic coordinates for map integration
6. Bulk import/export of locations
7. Delivery zone boundaries visualization

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify database migration ran successfully
3. Ensure all API endpoints are accessible
4. Review the order creation flow step by step
