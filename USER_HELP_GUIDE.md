# 📚 OrderZo Management System - User Help Guide

> **Welcome to OrderZo!** Your complete guide to managing your restaurant operations efficiently.

> **📖 Additional Resources:**
> - 🚀 [Quick Start Guide](QUICK_START_GUIDE.md) - Get started in 15 minutes
> - 📋 [Standard Operating Procedures](STANDARD_OPERATING_PROCEDURES.md) - Daily operations SOPs
> - 🔧 [Menu Management Enhancements](MENU_MANAGEMENT_ENHANCEMENTS.md) - Latest features

---

## 📖 Table of Contents

1. [Getting Started](#-getting-started)
2. [Customer Portal](#-customer-portal)
3. [Admin Panel](#-admin-panel)
4. [Delivery Boy Dashboard](#-delivery-boy-dashboard)
5. [Salesman Dashboard](#-salesman-dashboard)
6. [Reports & Analytics](#-reports--analytics)
7. [Troubleshooting](#-troubleshooting)
8. [FAQs](#-faqs)

---

## 🚀 Getting Started

### System Requirements
- ✅ Modern web browser (Chrome, Firefox, Safari, Edge)
- ✅ Stable internet connection
- ✅ Screen resolution: 1280x720 or higher (recommended)

### First Time Setup
1. **Access the Application**: Open your browser and navigate to your OrderZo application URL
2. **Admin Login**: Visit `/admin` to access the admin panel
3. **Default Credentials** (change immediately after first login):
   - Email: `admin@restaurant.com`
   - Password: `admin123`

### User Roles
- 👨‍💼 **Admin**: Full access to all features
- 👤 **Customer**: Browse menu, place orders, track deliveries
- 🚚 **Delivery Boy**: View assigned deliveries, update delivery status
- 💼 **Salesman**: Create orders, manage customer interactions

---

## 🍽️ Customer Portal

### Browsing the Menu

#### **Step 1: Access the Menu**
- Click **"Browse Menu"** from the homepage
- Or navigate to `/menu` directly

#### **Step 2: Filter & Search**
- 🔍 **Search Bar**: Type item names to find specific dishes
- 📂 **Categories**: Click category buttons to filter items
- 💚 **Availability**: Only available items are shown by default

#### **Step 3: View Item Details**
- Each menu card displays:
  - 📸 Item image
  - 💰 Price
  - 📝 Description
  - ✅ Availability status

### Shopping Cart

#### **Adding Items**
1. Click **"Add to Cart"** on any menu item
2. Adjust quantity using **+** and **-** buttons
3. View cart total in real-time

#### **Managing Cart**
- 🛒 Click cart icon in navbar to view cart
- ➕ Increase quantity
- ➖ Decrease quantity
- 🗑️ Remove items completely
- 💵 View subtotal, tax, and total

### Placing an Order

#### **Checkout Process**
1. **Review Cart**: Click **"Proceed to Checkout"**
2. **Enter Details**:
   - 📧 Email address
   - 📱 Phone number
   - 🏠 Delivery address
   - 📍 Select delivery location (if applicable)
3. **Payment Method**: Choose from:
   - 💵 Cash on Delivery
   - 💳 Card Payment
   - 📱 UPI
   - 🏦 Net Banking
4. **Place Order**: Click **"Place Order"** button

#### **Order Confirmation**
- ✅ Receive order confirmation with Order ID
- 📧 Email confirmation (if configured)
- 🔗 Redirect to order tracking page

### Tracking Orders

#### **View Your Orders**
1. Navigate to **"Orders"** page (`/orders`)
2. Enter your **phone number** or **email**
3. View all your orders with:
   - 🆔 Order ID
   - 📅 Order date & time
   - 💰 Total amount
   - 📊 Order status
   - 🚚 Delivery status

#### **Order Status Types**
- 🟡 **Pending**: Order received, awaiting confirmation
- 🔵 **Confirmed**: Order confirmed by restaurant
- 👨‍🍳 **Preparing**: Food is being prepared
- 🚚 **Out for Delivery**: Delivery boy assigned
- ✅ **Delivered**: Order completed
- ❌ **Cancelled**: Order cancelled

---

## 👨‍💼 Admin Panel

### Dashboard Overview

#### **Accessing Dashboard**
1. Login at `/admin`
2. Dashboard shows:
   - 📊 **Revenue Statistics**: Today, this week, this month
   - 📦 **Order Counts**: Pending, confirmed, delivered
   - 📈 **Analytics Charts**: Revenue trends
   - 🕐 **Recent Orders**: Latest 10 orders

### Menu Management

#### **Viewing Menu Items**
- Navigate to **Admin → Menu**
- View all items with:
  - Image, name, price
  - Category
  - Availability status
  - Action buttons

#### **🔍 Searching Menu Items** ✨ NEW
1. Use the **search bar** at the top of the menu page
2. Search by:
   - 📝 Item name
   - 📄 Description
   - 📂 Category name
3. Results update in real-time as you type
4. View the count of matching items below the search bar
5. Clear search to view all items again

**Search Tips:**
- Search is case-insensitive
- Partial matches are supported
- Use category names to filter by category
- Combine keywords for better results

#### **Adding New Menu Item**
1. Click **"+ Add Item"** button
2. Fill in the form:
   - 📝 **Name**: Item name (required)
   - 💰 **Price**: Item price in ₹ (required)
   - 📂 **Category**: Select from dropdown (required)
   - 📄 **Description**: Brief description (optional)
   - 📊 **GST Rate**: Select applicable GST rate (default: 5%)
   - 🖼️ **Product Image**: Upload item image (optional)
   - ✅ **Available**: Check to make item available for ordering
3. **Image Upload**:
   - Click **"Choose File"** or drag and drop
   - Supported formats: JPG, PNG, GIF, WebP
   - Recommended size: 800x800 pixels or higher
   - Maximum file size: 5MB
   - Preview appears below the upload field
4. Click **"Add Item"** to save

**Image Upload Tips:**
- Use high-quality, well-lit food photos
- Square images work best (1:1 aspect ratio)
- Compress large images before uploading
- Images are automatically optimized and stored

#### **Editing Menu Items**
1. Click **"Edit"** button on any item
2. Modify fields as needed:
   - Update name, price, description
   - Change category
   - Adjust GST rate
   - **Upload new image** or keep existing one
3. **Changing Images**:
   - Current image preview is shown
   - Select new file to replace existing image
   - Leave file input empty to keep current image
   - New image will replace old one upon saving
4. Click **"Update Item"** to save changes

**Important Notes:**
- ✅ Image upload now works correctly for both add and edit operations
- ✅ Existing images are preserved when editing without uploading new image
- ✅ All changes are saved immediately to the database

#### **Deleting Menu Items**
1. Click **"Delete"** button
2. Confirm deletion in popup
3. Item removed from menu permanently
4. Associated image is also removed

⚠️ **Warning**: Deleted items cannot be recovered. Consider marking items as "unavailable" instead.

#### **Toggle Availability**
- Click the **"Enable/Disable"** button to toggle availability
- Available items show with green badge
- Unavailable items show with red badge
- Unavailable items won't show to customers
- Use this for seasonal items or temporary stock-outs

### Category Management

#### **Managing Categories**
- Navigate to **Admin → Categories**
- **Add Category**: Create new menu categories
- **Edit Category**: Update category names
- **Delete Category**: Remove unused categories
- **Sort Order**: Drag to reorder categories

### Order Management

#### **Viewing Orders**
- Navigate to **Admin → Orders**
- View all orders with filters:
  - 📅 Date range
  - 📊 Status filter
  - 💳 Payment status
  - 🔍 Search by order ID or customer

#### **Processing Orders**
1. **View Order Details**: Click on any order
2. **Update Order Status**:
   - Change status dropdown
   - Click **"Update Status"**
3. **Update Payment Status**:
   - Mark as Paid/Pending
   - Click **"Update Payment"**
4. **Assign Delivery Boy**:
   - Select from dropdown
   - Delivery boy receives notification

#### **Order Actions**
- 📄 **View Invoice**: Generate and view invoice
- ✏️ **Edit Order**: Modify order items (before preparation)
- ❌ **Cancel Order**: Cancel with reason
- 📞 **Contact Customer**: View contact details

### Billing & Invoices

#### **Generating Invoices**
1. Navigate to **Admin → Invoices**
2. Click **"Generate Invoice"** for any order
3. Invoice includes:
   - 🏢 Restaurant details
   - 👤 Customer information
   - 📋 Itemized list
   - 💰 Tax breakdown (GST)
   - 💵 Total amount

#### **Invoice Types**
- 📄 **Tax Invoice**: For regular GST orders
- 📋 **Bill of Supply**: For non-GST orders

#### **Viewing Invoices**
- View all generated invoices
- Download as PDF
- Print directly
- Email to customer

### Sales Management

#### **Creating Sales Orders**
1. Navigate to **Admin → Sales**
2. Click **"New Order"**
3. Select items and quantities
4. Enter customer details
5. Choose payment method
6. Generate invoice immediately

#### **Sales Reports**
- View daily sales
- Filter by date range
- Export to Excel/PDF
- View payment method breakdown

### Delivery Management

#### **Managing Delivery Boys**
1. Navigate to **Admin → Delivery Boys**
2. **Add Delivery Boy**:
   - Name, phone, email
   - Commission rate & type
   - Vehicle details
3. **View Performance**:
   - Total deliveries
   - Earnings
   - Rating
4. **Assign Orders**: Manually assign orders

#### **Delivery Locations**
1. Navigate to **Admin → Delivery Locations**
2. **Add Location**:
   - Location name
   - Delivery charge
   - Estimated time
3. **Edit/Delete**: Manage existing locations

### Salesman Management

#### **Managing Salesmen**
1. Navigate to **Admin → Salesmen**
2. **Add Salesman**:
   - Name, phone, email
   - Commission settings
   - Territory assignment
3. **Track Performance**:
   - Orders created
   - Revenue generated
   - Commission earned

### GST & Tax Reports

#### **Accessing GST Reports**
1. Navigate to **Admin → GST Report**
2. Select date range
3. View:
   - 📊 CGST, SGST, IGST breakdown
   - 💰 Taxable amount
   - 📈 Tax collected
   - 📄 GSTR-1 ready format

#### **Exporting Reports**
- Export to Excel
- Export to PDF
- Download GSTR-1 JSON

### Analytics

#### **Revenue Analytics**
- Navigate to **Admin → Analytics**
- View charts:
  - 📈 Daily revenue trends
  - 📊 Category-wise sales
  - 🥧 Payment method distribution
  - 📅 Monthly comparisons

#### **Customer Analytics**
- New vs returning customers
- Average order value
- Popular items
- Peak ordering times

### Cashbook

#### **Managing Cash Transactions**
1. Navigate to **Admin → Cashbook**
2. **Record Transactions**:
   - Cash in/out
   - Expense categories
   - Notes
3. **View Balance**: Current cash balance
4. **Reports**: Daily cash summary

### Data Management

#### **Exporting Data**
1. Navigate to **Admin → Data Management**
2. Click **"Export Data"**
3. Select data types:
   - ✅ Menu items
   - ✅ Categories
   - ✅ Orders
   - ✅ Customers
4. Download JSON file

#### **Importing Data**
1. Click **"Import Data"**
2. Upload JSON file
3. Review preview
4. Confirm import
5. Data merged with existing records

⚠️ **Important**: Always backup before importing!

### Settings

#### **Restaurant Settings**
- Navigate to **Admin → Settings**
- Configure:
  - 🏢 Restaurant name & details
  - 📧 Contact information
  - 🕐 Operating hours
  - 💳 Payment methods
  - 📱 Notification preferences
  - 🧾 GST settings

---

## 🚚 Delivery Boy Dashboard

### Accessing Dashboard
1. Login at `/delivery`
2. Enter credentials provided by admin

### Viewing Assigned Deliveries

#### **Dashboard Overview**
- 📦 **Pending Deliveries**: Orders to be delivered
- ✅ **Completed**: Delivered orders
- 💰 **Today's Earnings**: Commission earned
- 📊 **Performance Stats**: Delivery count, rating

#### **Delivery Details**
Each delivery shows:
- 🆔 Order ID
- 👤 Customer name & phone
- 📍 Delivery address
- 💵 Order amount
- 🕐 Order time

### Updating Delivery Status

#### **Mark as Picked Up**
1. Click on order
2. Click **"Mark as Picked Up"**
3. Status updates to "Out for Delivery"

#### **Mark as Delivered**
1. Arrive at customer location
2. Click **"Mark as Delivered"**
3. Confirm delivery
4. Commission automatically calculated

### Earnings & Payouts

#### **View Earnings**
- Daily earnings summary
- Commission breakdown per order
- Total pending payout

#### **Payout History**
- Navigate to **Payouts**
- View all received payouts
- Download payout statements

---

## 💼 Salesman Dashboard

### Accessing Dashboard
1. Login at `/salesman`
2. Enter credentials provided by admin

### Creating Orders

#### **New Order Process**
1. Click **"New Order"**
2. **Select Items**:
   - Browse menu
   - Add items to order
   - Set quantities
3. **Customer Details**:
   - Name, phone, address
   - Delivery location
4. **Payment Method**: Select payment type
5. **Submit Order**: Order sent to kitchen

### Managing Customer Orders

#### **View Orders**
- All orders created by you
- Filter by status
- Search by customer

#### **Order Actions**
- View order details
- Contact customer
- Track delivery status

### Performance Tracking

#### **Sales Dashboard**
- 💰 Total sales amount
- 📦 Number of orders
- 💵 Commission earned
- 📈 Performance trends

---

## 📊 Reports & Analytics

### Available Reports

#### **1. Sales Report**
- Daily/Weekly/Monthly sales
- Category-wise breakdown
- Payment method analysis
- Export to Excel/PDF

#### **2. GST Report**
- Tax collected summary
- CGST/SGST/IGST breakdown
- GSTR-1 format
- Date range filter

#### **3. Outstanding Report**
- Pending payments
- Customer-wise outstanding
- Aging analysis
- Follow-up reminders

#### **4. Delivery Report**
- Delivery boy performance
- Average delivery time
- Customer ratings
- Commission summary

#### **5. Inventory Report** (if enabled)
- Stock levels
- Low stock alerts
- Usage patterns
- Reorder suggestions

### Generating Reports

#### **Standard Process**
1. Navigate to desired report section
2. Select **date range**
3. Apply **filters** (if any)
4. Click **"Generate Report"**
5. View on screen or **Download**

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### **🔴 Cannot Login**
**Problem**: Login fails with incorrect credentials
**Solution**:
- Verify email and password
- Check caps lock
- Contact admin for password reset
- Clear browser cache and cookies

#### **🔴 Menu Items Not Showing**
**Problem**: Menu appears empty
**Solution**:
- Check if items are marked as "Available"
- Verify category filters
- Clear search bar
- Refresh the page (F5)

#### **🔴 Cart Not Updating**
**Problem**: Items not adding to cart
**Solution**:
- Enable browser cookies
- Disable ad blockers
- Try incognito/private mode
- Clear browser cache

#### **🔴 Order Not Placing**
**Problem**: Checkout fails
**Solution**:
- Verify all required fields filled
- Check internet connection
- Ensure items are still available
- Try different payment method

#### **🔴 Invoice Not Generating**
**Problem**: Invoice generation fails
**Solution**:
- Ensure order is confirmed
- Check if all order details complete
- Verify GST settings (admin)
- Contact technical support

#### **🔴 Data Export Fails**
**Problem**: Cannot export data
**Solution**:
- Check browser download settings
- Disable popup blockers
- Try different browser
- Verify admin permissions

### Performance Issues

#### **Slow Loading**
- Clear browser cache
- Check internet speed
- Close unnecessary tabs
- Try different browser

#### **Images Not Loading**
- Check internet connection
- Verify image URLs
- Clear browser cache
- Contact admin if persistent

---

## ❓ FAQs

### For Customers

**Q: How do I track my order?**
A: Go to the Orders page and enter your phone number or email to view all your orders and their current status.

**Q: Can I cancel my order?**
A: Yes, contact the restaurant immediately. Orders can be cancelled before they enter "Preparing" status.

**Q: What payment methods are accepted?**
A: Cash on Delivery, Card Payment, UPI, and Net Banking (availability may vary).

**Q: How is delivery charge calculated?**
A: Delivery charges are based on your selected delivery location and are shown at checkout.

**Q: Can I modify my order after placing it?**
A: Contact the restaurant immediately. Modifications are possible only before preparation starts.

### For Admins

**Q: How do I add a new menu item?**
A: Go to Admin → Menu → Add New Item, fill in the details, upload an image, and save.

**Q: How do I assign a delivery boy to an order?**
A: Open the order details and select a delivery boy from the dropdown, then click "Assign".

**Q: Can I customize the invoice format?**
A: Yes, invoice templates can be customized in the Settings section.

**Q: How do I backup my data?**
A: Use the Data Management section to export all data as JSON. Store this file safely.

**Q: How do I handle GST settings?**
A: Navigate to Settings → GST Configuration to set up tax rates and invoice preferences.

**Q: Can I delete old orders?**
A: Orders can be archived but not deleted to maintain financial records. Use the archive feature in Order Management.

### For Delivery Boys

**Q: How is my commission calculated?**
A: Commission is set by the admin and can be either a fixed amount per delivery or a percentage of the order value.

**Q: When do I receive my payout?**
A: Payout schedules are set by the admin (typically weekly or monthly).

**Q: What if customer is not available?**
A: Contact the customer via phone. If unreachable, contact the restaurant admin for instructions.

### For Salesmen

**Q: How do I create an order for a customer?**
A: Login to your salesman dashboard, click "New Order", select items, enter customer details, and submit.

**Q: How is my commission tracked?**
A: Your dashboard shows all orders you've created and the commission earned on each.

**Q: Can I view all customer orders?**
A: You can only view orders that you have created, not orders from other salesmen or direct customer orders.

---

## 📞 Support & Contact

### Getting Help

**Technical Support**
- 📧 Email: support@orderzorestaurant.com
- 📱 Phone: [Your Support Number]
- 🕐 Hours: 9 AM - 9 PM (Mon-Sat)

**Admin Support**
- For admin-related queries, contact your system administrator
- Check documentation in the `/docs` folder

**Feature Requests**
- Submit feature requests through the admin panel
- Or email: features@orderzorestaurant.com

---

## 🎓 Best Practices

### For Admins

1. ✅ **Regular Backups**: Export data weekly
2. ✅ **Update Menu**: Keep menu items and prices current
3. ✅ **Monitor Orders**: Check pending orders regularly
4. ✅ **Review Reports**: Analyze sales trends weekly
5. ✅ **Train Staff**: Ensure all users understand their roles
6. ✅ **Security**: Change default passwords immediately
7. ✅ **Customer Service**: Respond to orders promptly

### For Customers

1. ✅ **Accurate Details**: Provide correct phone and address
2. ✅ **Check Order**: Review cart before checkout
3. ✅ **Track Status**: Monitor order progress
4. ✅ **Feedback**: Rate your experience
5. ✅ **Payment**: Keep payment ready for COD

### For Delivery Boys

1. ✅ **Check Orders**: Review delivery details before pickup
2. ✅ **Contact Customer**: Call if address unclear
3. ✅ **Update Status**: Mark status changes promptly
4. ✅ **Professional**: Maintain courteous behavior
5. ✅ **Timely**: Deliver within estimated time

---

## 🔐 Security & Privacy

### Data Protection
- All customer data is encrypted
- Payment information is secure
- Regular security updates applied

### Password Security
- Use strong passwords (8+ characters)
- Mix uppercase, lowercase, numbers, symbols
- Change passwords regularly
- Never share credentials

### Privacy Policy
- Customer data used only for order processing
- No data shared with third parties
- Customers can request data deletion

---

## 📱 Mobile Usage

### Mobile-Friendly Features
- ✅ Responsive design for all screen sizes
- ✅ Touch-optimized buttons
- ✅ Easy navigation
- ✅ Fast loading on mobile networks

### Tips for Mobile Users
- Use Chrome or Safari for best experience
- Enable location services for delivery
- Save app to home screen for quick access
- Ensure stable internet connection

---

## 🎉 Tips & Tricks

### Quick Actions
- **Keyboard Shortcuts** (Admin Panel):
  - `Ctrl + N`: New order
  - `Ctrl + M`: Menu management
  - `Ctrl + D`: Dashboard
  - `Ctrl + S`: Settings

### Efficiency Tips
1. **Bulk Actions**: Select multiple orders to update status
2. **Filters**: Use filters to find orders quickly
3. **Search**: Use search bar for instant results
4. **Favorites**: Bookmark frequently used pages
5. **Templates**: Save common order configurations

---

## 📝 Changelog & Updates

### Version History
Check the `CHANGELOG.md` file for:
- Latest features
- Bug fixes
- Performance improvements
- Breaking changes

### Staying Updated
- Subscribe to update notifications
- Check admin dashboard for announcements
- Review release notes regularly

---

## 🌟 Conclusion

Thank you for using **OrderZo Management System**! This comprehensive platform is designed to streamline your restaurant operations, from customer orders to delivery management.

### Quick Links
- 🏠 [Homepage](/)
- 🍽️ [Menu](/menu)
- 👨‍💼 [Admin Panel](/admin)
- 📊 [Dashboard](/admin/dashboard)
- ⚙️ [Settings](/admin/settings)

### Need More Help?
- 📖 Check our [README.md](README.md) for technical details
- 📧 Contact support for assistance
- 💡 Submit feedback for improvements

---

**Happy Managing! 🎉**

*Last Updated: December 16, 2025*  
*Version: 2.1 - Added search functionality and fixed image upload*

