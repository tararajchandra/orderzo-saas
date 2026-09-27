# 🚀 Ruchi Restaurant Management System - Quick Start Guide

> **Get started in 15 minutes!** This guide will help you set up and start using Ruchi immediately.

---

## 📋 Table of Contents

1. [First-Time Setup](#first-time-setup)
2. [Quick Tour](#quick-tour)
3. [Common Tasks](#common-tasks)
4. [Tips for Success](#tips-for-success)

---

## 🎯 First-Time Setup

### Step 1: Access the System (2 minutes)

1. **Open your web browser** (Chrome, Firefox, Safari, or Edge)
2. **Navigate to your Ruchi URL:**
   - Example: `https://your-restaurant.com`
   - Or: `http://localhost:3000` (for local installation)

### Step 2: Admin Login (1 minute)

1. **Go to Admin Panel:**
   - Add `/admin` to your URL
   - Example: `https://your-restaurant.com/admin`

2. **Login with default credentials:**
   ```
   Email: admin@restaurant.com
   Password: admin123
   ```

3. **⚠️ IMPORTANT:** Change your password immediately!
   - Go to **Settings → Change Password**
   - Use a strong password (12+ characters)

### Step 3: Restaurant Setup (5 minutes)

1. **Navigate to Settings:**
   - Click **"Settings"** in the sidebar
   - Or go to `/admin/settings`

2. **Fill in Restaurant Details:**
   - 🏢 **Restaurant Name:** Your restaurant name
   - 📍 **Address:** Complete address
   - 📞 **Phone:** Contact number
   - 📧 **Email:** Business email
   - 🧾 **GSTIN:** GST registration number (if applicable)

3. **Configure GST Settings:**
   - Default GST rate: 5% or 18%
   - Enable/disable GST on invoices
   - Set tax preferences

4. **Save Settings:**
   - Click **"Save Changes"**
   - Settings applied immediately

### Step 4: Create Categories (3 minutes)

1. **Navigate to Categories:**
   - Click **"Categories"** in admin menu
   - Or go to `/admin/categories`

2. **Add Categories:**
   - Click **"+ Add Category"**
   - Enter category name (e.g., "Starters", "Main Course", "Desserts")
   - Click **"Save"**
   - Repeat for all categories

3. **Suggested Categories:**
   - 🥗 Starters / Appetizers
   - 🍛 Main Course
   - 🍚 Rice & Breads
   - 🍰 Desserts
   - 🥤 Beverages

### Step 5: Add Menu Items (5 minutes per item)

1. **Navigate to Menu:**
   - Click **"Menu"** in admin panel
   - Or go to `/admin/menu`

2. **Add Your First Item:**
   - Click **"+ Add Item"** button
   - Fill in the form:
     - **Name:** "Chicken Biryani" (example)
     - **Price:** 250
     - **Category:** Select "Main Course"
     - **Description:** "Aromatic basmati rice with tender chicken"
     - **GST Rate:** 5%
     - **Image:** Upload food photo
     - **Available:** ✅ Check this box

3. **Upload Image:**
   - Click **"Choose File"**
   - Select image (JPG/PNG, max 5MB)
   - Preview appears below
   - Image should be appetizing and well-lit

4. **Save Item:**
   - Click **"Add Item"**
   - Item appears in menu list
   - Verify on customer menu page

5. **Repeat for all menu items**

---

## 🎪 Quick Tour

### Admin Dashboard

**What you'll see:**
- 📊 **Revenue Stats:** Today, this week, this month
- 📦 **Order Counts:** Pending, confirmed, delivered
- 📈 **Charts:** Revenue trends
- 🕐 **Recent Orders:** Latest 10 orders

**Quick Actions:**
- Create new order
- View all orders
- Manage menu
- Generate reports

### Menu Management

**Features:**
- 🔍 **Search Bar:** Find items quickly by name, description, or category
- 📋 **Item Cards:** Visual display with images
- ✏️ **Quick Edit:** Edit items inline
- 🔄 **Toggle Availability:** Enable/disable items instantly

**Search Tips:**
- Type item name: "biryani"
- Search by category: "desserts"
- Search description: "spicy"
- Results update as you type

### Order Management

**Order Flow:**
1. **Pending** → New order received
2. **Confirmed** → Order accepted
3. **Preparing** → Kitchen is cooking
4. **Ready** → Food ready for pickup
5. **Out for Delivery** → Delivery boy assigned
6. **Delivered** → Order completed

**Actions Available:**
- View order details
- Update status
- Assign delivery boy
- Generate invoice
- Contact customer

---

## ⚡ Common Tasks

### Task 1: Process a New Order (2 minutes)

**When new order arrives:**

1. **Notification appears** on dashboard
2. **Click on order** to view details
3. **Verify items** are available
4. **Change status** to "Confirmed"
5. **Print KOT** for kitchen
6. **Update to "Preparing"** when cooking starts
7. **Assign delivery boy** when ready

**Timeline:** Confirm within 2 minutes of receiving order

---

### Task 2: Create Walk-in Order (3 minutes)

**For phone/counter orders:**

1. **Navigate to:** Admin → Orders → Create
2. **Search and add items:**
   - Use search bar to find items
   - Click "Add" for each item
   - Adjust quantities
3. **Enter customer details:**
   - Name (required)
   - Mobile (required)
   - Address (for delivery)
4. **Select payment method:**
   - Cash / Card / UPI
5. **Click "Save & Print":**
   - Invoice prints automatically
   - Order sent to kitchen

---

### Task 3: Update Menu Item (1 minute)

**To change price or availability:**

1. **Go to:** Admin → Menu
2. **Search for item:** Type name in search bar
3. **Click "Edit"** on item card
4. **Make changes:**
   - Update price
   - Change description
   - Upload new image (optional)
   - Toggle availability
5. **Click "Update Item"**

**Quick Tip:** To just toggle availability, click "Enable/Disable" button directly!

---

### Task 4: Mark Item Unavailable (30 seconds)

**When item is out of stock:**

1. **Go to:** Admin → Menu
2. **Search for item**
3. **Click "Disable"** button
4. **Item marked unavailable** (red badge)
5. **Customers won't see** this item

**To re-enable:** Click "Enable" button

---

### Task 5: Generate Daily Report (2 minutes)

**End of day:**

1. **Go to:** Admin → Reports
2. **Select "Sales Report"**
3. **Set date:** Today
4. **Click "Generate"**
5. **Review metrics:**
   - Total orders
   - Total revenue
   - Best sellers
6. **Export to Excel** for records

---

### Task 6: Assign Delivery Boy (1 minute)

**When order is ready:**

1. **Open order details**
2. **Scroll to "Delivery Assignment"**
3. **Select delivery boy** from dropdown
4. **Click "Assign"**
5. **Delivery boy receives notification**
6. **Track delivery status** in real-time

---

### Task 7: Backup Data (2 minutes)

**Daily backup (end of day):**

1. **Go to:** Admin → Data Management
2. **Click "Export Data"**
3. **Select all data types**
4. **Click "Export All"**
5. **Download JSON file**
6. **Save with date:** `backup_2025-12-16.json`
7. **Upload to cloud storage**

---

## 💡 Tips for Success

### For Admins

1. **✅ Check Orders Regularly**
   - Monitor dashboard every 15 minutes during busy hours
   - Respond to new orders within 2 minutes
   - Keep customers informed of delays

2. **✅ Keep Menu Updated**
   - Update availability daily (morning and evening)
   - Mark out-of-stock items immediately
   - Use search bar to find items quickly
   - Update prices as needed

3. **✅ Use Search Effectively**
   - Search by item name for quick edits
   - Search by category to update multiple items
   - Use description keywords to find related items

4. **✅ Backup Daily**
   - Never skip daily backups
   - Store backups in multiple locations
   - Test restore process monthly

5. **✅ Monitor Performance**
   - Review daily sales report
   - Track best-selling items
   - Identify slow-moving items
   - Adjust menu based on data

### For Salesmen

1. **✅ Know the Menu**
   - Familiarize yourself with all items
   - Know prices and descriptions
   - Understand GST rates
   - Use search to find items quickly

2. **✅ Accurate Customer Details**
   - Always get correct phone number
   - Confirm delivery address
   - Note any special instructions
   - Verify order before submitting

3. **✅ Professional Service**
   - Greet customers warmly
   - Suggest popular items
   - Inform about delivery time
   - Thank customers

### For Delivery Boys

1. **✅ Check Orders Before Leaving**
   - Verify all items in package
   - Confirm delivery address
   - Note customer phone number
   - Check payment method (COD/Prepaid)

2. **✅ Update Status Promptly**
   - Mark "Picked Up" when leaving restaurant
   - Update "Out for Delivery" en route
   - Mark "Delivered" immediately after delivery

3. **✅ Professional Delivery**
   - Call customer if address unclear
   - Handle food carefully
   - Be polite and courteous
   - Collect payment for COD orders

---

## 🎓 Learning Path

### Week 1: Basics
- [ ] Complete first-time setup
- [ ] Add all menu items
- [ ] Process 10 test orders
- [ ] Generate first sales report
- [ ] Perform first backup

### Week 2: Intermediate
- [ ] Master order management
- [ ] Learn delivery assignment
- [ ] Generate GST reports
- [ ] Handle customer complaints
- [ ] Optimize menu based on sales

### Week 3: Advanced
- [ ] Analyze sales trends
- [ ] Implement promotions
- [ ] Train additional staff
- [ ] Customize invoice templates
- [ ] Set up automated backups

---

## 🆘 Quick Help

### Common Questions

**Q: How do I search for menu items?**
A: Use the search bar at the top of the Admin → Menu page. Type item name, description, or category.

**Q: Image not uploading?**
A: Check file size (<5MB) and format (JPG/PNG). Clear browser cache if issue persists.

**Q: How do I change item availability?**
A: Go to Admin → Menu, find the item, click "Disable" or "Enable" button.

**Q: Order not showing?**
A: Refresh the page (F5). Check internet connection. Verify order status filter.

**Q: How do I print invoice?**
A: Open order details, click "Generate Invoice", then "Print" button.

### Need More Help?

📖 **Full Documentation:**
- [User Help Guide](USER_HELP_GUIDE.md)
- [Standard Operating Procedures](STANDARD_OPERATING_PROCEDURES.md)

📧 **Support:**
- Email: support@ruchirestaurant.com
- Phone: [Your Support Number]

---

## ✅ Setup Checklist

**Before Going Live:**

- [ ] Changed default admin password
- [ ] Added restaurant details in settings
- [ ] Configured GST settings
- [ ] Created all menu categories
- [ ] Added menu items with images
- [ ] Tested order creation
- [ ] Tested invoice generation
- [ ] Set up delivery boys (if applicable)
- [ ] Performed test backup
- [ ] Trained all staff members
- [ ] Tested customer-facing menu page
- [ ] Verified payment methods work
- [ ] Set up daily backup routine

---

## 🎉 You're Ready!

Congratulations! You've completed the quick start guide. You're now ready to manage your restaurant with Ruchi.

### Next Steps:

1. **Start Taking Orders** 🎯
2. **Monitor Performance** 📊
3. **Optimize Menu** 🍽️
4. **Grow Your Business** 📈

**Happy Managing!** 🚀

---

*Last Updated: December 2025*  
*Version: 2.0*
