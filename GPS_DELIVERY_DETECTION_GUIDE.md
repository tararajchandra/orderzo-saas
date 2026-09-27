# GPS-Based Delivery Location Detection - Implementation Guide

## 🎯 Overview

This feature enables **automatic delivery zone detection** using GPS coordinates. Customers can click a button to detect their location, and the system will automatically select the appropriate delivery zone and charge.

---

## ✅ What Has Been Implemented

### 1. **Database Migration** ✓
- Added `latitude`, `longitude`, and `radius_km` columns to `delivery_locations` table
- Sample GPS coordinates for all existing delivery zones
- Database indexes for faster GPS queries

**File:** `database/migrations/008_add_gps_to_delivery_locations.sql`

### 2. **Admin Panel Updates** ✓
- GPS coordinate input fields in delivery location form
- Latitude, Longitude, and Radius (km) fields
- Link to Google Maps for finding coordinates
- Visual highlighting of GPS section

**File:** `app/admin/delivery-locations/page.tsx`

### 3. **Backend API** ✓

#### GPS Detection Endpoint
**POST** `/api/delivery-locations/detect`

**Request:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Detected delivery zone: City Center",
  "data": {
    "location": {
      "id": 1,
      "location_name": "City Center",
      "delivery_charge": 30.00,
      "latitude": 28.6139,
      "longitude": 77.2090,
      "radius_km": 3.0
    },
    "distance": 0.5,
    "alternatives": [...]
  }
}
```

**Response (Outside All Zones):**
```json
{
  "success": false,
  "error": "You are outside all delivery zones. Nearest zone is \"City Center\" (8.5km away)",
  "data": {
    "nearestLocation": {...},
    "allLocations": [...]
  }
}
```

**File:** `app/api/delivery-locations/detect/route.ts`

#### Updated Delivery Location APIs
- **POST** `/api/admin/delivery-locations` - Now accepts GPS coordinates
- **PUT** `/api/admin/delivery-locations/[id]` - Now accepts GPS coordinates
- Full validation for coordinate ranges

**Files:**
- `app/api/admin/delivery-locations/route.ts`
- `app/api/admin/delivery-locations/[id]/route.ts`

---

## 🚀 How to Deploy

### Step 1: Run Database Migration

```bash
node scripts/run_gps_migration.js
```

This will:
- Add GPS columns to the database
- Insert sample coordinates for existing locations
- Display a summary of all locations with GPS data

### Step 2: Update GPS Coordinates (Admin Panel)

1. Login to admin panel
2. Go to **Delivery Locations**
3. Click **Edit** on any location
4. Scroll to **GPS Coordinates** section
5. Enter:
   - **Latitude** (e.g., 28.6139)
   - **Longitude** (e.g., 77.2090)
   - **Radius** (e.g., 5.0 km)
6. Click **Update**

**How to find coordinates:**
1. Open [Google Maps](https://www.google.com/maps)
2. Right-click on the center of your delivery zone
3. Click on the coordinates to copy them
4. Paste into admin panel

---

## 📱 Customer Usage (To Be Implemented)

### Option A: Checkout Page Integration

Add a "Detect My Location" button to your checkout page:

```tsx
const detectLocation = async () => {
  if (!navigator.geolocation) {
    alert('GPS not supported by your browser');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      
      const response = await fetch('/api/delivery-locations/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Auto-select the detected location
        setSelectedLocation(data.data.location.id);
        setDeliveryCharge(data.data.location.delivery_charge);
        alert(`Detected: ${data.data.location.location_name}`);
      } else {
        alert(data.error);
      }
    },
    (error) => {
      alert('Could not get your location. Please select manually.');
    }
  );
};
```

### Option B: Quick Bill Integration

For the admin quick bill page, you can add GPS detection for delivery orders.

---

## 🔧 Technical Details

### Distance Calculation

Uses the **Haversine Formula** to calculate the distance between two GPS points:

```typescript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}
```

### Zone Matching Logic

1. Get customer's GPS coordinates
2. Calculate distance to all active delivery zones
3. Check if customer is within any zone's radius
4. Return the closest matching zone
5. If no match, return nearest zone as suggestion

---

## 📊 Sample GPS Coordinates (Delhi NCR)

| Location | Latitude | Longitude | Radius | Charge |
|----------|----------|-----------|--------|--------|
| City Center | 28.6139 | 77.2090 | 3.0 km | ₹30 |
| North Zone | 28.7041 | 77.1025 | 5.0 km | ₹50 |
| South Zone | 28.5355 | 77.3910 | 5.0 km | ₹50 |
| East Zone | 28.6692 | 77.4538 | 6.0 km | ₹60 |
| West Zone | 28.6692 | 77.0892 | 6.0 km | ₹60 |
| Suburbs | 28.4595 | 77.0266 | 8.0 km | ₹80 |
| Airport Area | 28.5562 | 77.1000 | 10.0 km | ₹100 |

**Note:** These are sample coordinates for Delhi NCR. Update them with your actual delivery zone coordinates.

---

## 🎨 User Experience Flow

### Admin Flow:
```
1. Admin creates delivery zone
   ↓
2. Sets GPS coordinates (lat, lng, radius)
   ↓
3. Saves location
   ↓
4. Location is now GPS-enabled
```

### Customer Flow:
```
1. Customer goes to checkout
   ↓
2. Clicks "📍 Detect My Location"
   ↓
3. Browser asks for permission
   ↓
4. Customer allows GPS access
   ↓
5. System detects coordinates
   ↓
6. API matches to nearest zone
   ↓
7. Location auto-selected
   ↓
8. Delivery charge applied
   ↓
9. Customer proceeds with order
```

---

## 🔒 Privacy & Security

### Browser Permissions
- GPS access requires user permission
- Works only on HTTPS (secure connection)
- User can deny and select manually

### Data Privacy
- GPS coordinates are NOT stored
- Only used for zone matching
- Coordinates sent to server only during detection
- No tracking or location history

---

## ⚠️ Important Notes

### 1. **HTTPS Required**
Browser Geolocation API only works on HTTPS. Ensure your site uses SSL certificate.

### 2. **Fallback to Manual Selection**
Always provide manual dropdown as backup:
- User denies GPS permission
- GPS not available
- Inaccurate detection
- User prefers manual selection

### 3. **Accuracy**
- GPS accuracy: 10-50 meters (typical)
- Works best outdoors
- May be less accurate indoors
- Urban areas have better accuracy

### 4. **Testing**
Test with different scenarios:
- ✅ Inside delivery zone
- ✅ Outside all zones
- ✅ Between multiple zones
- ✅ GPS permission denied
- ✅ GPS not supported

---

## 🐛 Troubleshooting

### GPS Detection Not Working

**Issue:** "GPS not supported"
- **Solution:** Ensure HTTPS is enabled
- **Solution:** Use modern browser (Chrome, Firefox, Safari, Edge)

**Issue:** "Permission denied"
- **Solution:** User must allow location access
- **Solution:** Provide manual selection option

**Issue:** "Inaccurate detection"
- **Solution:** Adjust radius_km for zones
- **Solution:** Ensure GPS coordinates are correct
- **Solution:** Test outdoors for better accuracy

### Database Issues

**Issue:** Migration fails
- **Solution:** Check database connection
- **Solution:** Ensure PostgreSQL is running
- **Solution:** Verify DATABASE_URL in .env.local

**Issue:** Coordinates not saving
- **Solution:** Check column types (DECIMAL)
- **Solution:** Verify API validation passes
- **Solution:** Check browser console for errors

---

## 📈 Future Enhancements

Potential improvements:
1. **Map View** - Show delivery zones on a map
2. **Address Geocoding** - Convert address to GPS
3. **Polygon Zones** - Define irregular zone boundaries
4. **Dynamic Pricing** - Charge based on exact distance
5. **ETA Calculation** - Estimate delivery time
6. **Zone Visualization** - Draw circles on map
7. **Bulk Import** - Import multiple zones with GPS

---

## 💰 Cost Summary

**Total Implementation Cost: ₹0 (FREE)**

- ✅ Browser Geolocation API - FREE
- ✅ Haversine Distance Formula - FREE
- ✅ No external APIs needed - FREE
- ✅ No monthly fees - FREE
- ✅ No usage limits - FREE

---

## 📝 Files Created/Modified

### New Files:
1. `database/migrations/008_add_gps_to_delivery_locations.sql`
2. `scripts/run_gps_migration.js`
3. `app/api/delivery-locations/detect/route.ts`
4. `GPS_DELIVERY_DETECTION_GUIDE.md` (this file)

### Modified Files:
1. `app/admin/delivery-locations/page.tsx`
2. `app/api/admin/delivery-locations/route.ts`
3. `app/api/admin/delivery-locations/[id]/route.ts`

---

## ✅ Next Steps

1. **Run Migration:**
   ```bash
   node scripts/run_gps_migration.js
   ```

2. **Update Coordinates:**
   - Login to admin panel
   - Edit each delivery location
   - Add GPS coordinates

3. **Test Detection:**
   - Use the API endpoint directly
   - Or integrate into checkout page

4. **Deploy to Production:**
   - Ensure HTTPS is enabled
   - Test on mobile devices
   - Monitor for accuracy

---

## 🎉 Ready to Use!

The GPS-based delivery detection system is now fully implemented and ready for use. The backend is complete, and you can now integrate the "Detect My Location" button into your customer-facing pages.

**Need Help?**
- Check the API documentation above
- Review the sample code snippets
- Test the `/api/delivery-locations/detect` endpoint
- Verify GPS coordinates in admin panel

---

**Last Updated:** 2025-12-26
**Version:** 1.0.0
**Status:** ✅ Backend Complete, Frontend Integration Pending
