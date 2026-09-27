# 📋 Ruchi Restaurant Management System - Standard Operating Procedures (SOP)

> **Document Version:** 2.0  
> **Last Updated:** December 2025  
> **Purpose:** Standardized procedures for daily operations and management

---

## 📑 Table of Contents

1. [Daily Operations](#daily-operations)
2. [Order Processing](#order-processing)
3. [Menu Management](#menu-management)
4. [Inventory & Stock](#inventory--stock)
5. [Billing & Invoicing](#billing--invoicing)
6. [Delivery Management](#delivery-management)
7. [Customer Service](#customer-service)
8. [Reporting & Analytics](#reporting--analytics)
9. [Data Backup & Security](#data-backup--security)
10. [Emergency Procedures](#emergency-procedures)

---

## 🌅 Daily Operations

### Morning Opening Procedures (Before Service)

#### **Admin/Manager Tasks**
**Time: 30 minutes before opening**

1. **System Login & Verification**
   - [ ] Login to admin panel at `/admin`
   - [ ] Verify system is operational
   - [ ] Check for any overnight orders
   - [ ] Review pending notifications

2. **Menu Availability Check**
   - [ ] Navigate to **Admin → Menu**
   - [ ] Use search bar to quickly find items
   - [ ] Mark unavailable items (out of stock)
   - [ ] Update prices if needed
   - [ ] Verify all images are displaying correctly

3. **Staff Verification**
   - [ ] Check delivery boys logged in
   - [ ] Verify salesman accounts active
   - [ ] Assign territories/zones if applicable

4. **Cash Register Setup**
   - [ ] Navigate to **Admin → Cashbook**
   - [ ] Record opening cash balance
   - [ ] Verify previous day's closing balance
   - [ ] Note any discrepancies

5. **System Health Check**
   - [ ] Test order placement (dummy order)
   - [ ] Verify payment gateways working
   - [ ] Check printer connectivity (for KOT/invoices)
   - [ ] Test delivery assignment system

**Estimated Time:** 20-30 minutes

---

### Evening Closing Procedures (After Service)

#### **Admin/Manager Tasks**
**Time: After last order delivered**

1. **Order Reconciliation**
   - [ ] Navigate to **Admin → Orders**
   - [ ] Filter by today's date
   - [ ] Verify all orders have final status
   - [ ] Check for any pending orders
   - [ ] Contact customers for undelivered orders

2. **Payment Reconciliation**
   - [ ] Generate **Sales Report** for the day
   - [ ] Match cash payments with cashbook
   - [ ] Verify online payment settlements
   - [ ] Record any discrepancies

3. **Delivery Boy Settlement**
   - [ ] Navigate to **Admin → Delivery Boys**
   - [ ] Review today's deliveries per person
   - [ ] Calculate commissions
   - [ ] Record cash collected (COD orders)
   - [ ] Settle accounts

4. **Cash Closing**
   - [ ] Count physical cash
   - [ ] Record closing balance in Cashbook
   - [ ] Note expenses for the day
   - [ ] Prepare bank deposit (if applicable)

5. **Data Backup**
   - [ ] Navigate to **Admin → Data Management**
   - [ ] Click **"Export Data"**
   - [ ] Save backup file with date: `backup_YYYY-MM-DD.json`
   - [ ] Store in secure location (cloud/external drive)

6. **Menu Planning for Tomorrow**
   - [ ] Review low-stock items
   - [ ] Plan menu availability for next day
   - [ ] Update any special offers
   - [ ] Schedule any menu changes

**Estimated Time:** 30-45 minutes

---

## 📦 Order Processing

### SOP-001: Receiving Online Orders

#### **Objective:** Process customer orders efficiently and accurately

#### **Procedure:**

1. **Order Notification**
   - System sends notification for new order
   - Admin dashboard shows pending order count
   - Order appears in **Admin → Orders** with "Pending" status

2. **Order Verification** (Within 2 minutes)
   - [ ] Open order details
   - [ ] Verify all items are available
   - [ ] Check delivery address is serviceable
   - [ ] Confirm customer contact details

3. **Order Confirmation**
   - [ ] If all items available → Change status to **"Confirmed"**
   - [ ] If items unavailable → Contact customer immediately
   - [ ] Update estimated preparation time
   - [ ] System sends confirmation to customer

4. **Kitchen Order Ticket (KOT)**
   - [ ] Generate KOT automatically or manually
   - [ ] Print KOT for kitchen
   - [ ] KOT includes: Order ID, items, quantities, special instructions
   - [ ] Kitchen acknowledges receipt

5. **Status Updates**
   - [ ] When cooking starts → Update to **"Preparing"**
   - [ ] When food ready → Update to **"Ready for Pickup"**
   - [ ] Notify delivery boy for pickup

**Timeline:**
- Order received → Confirmed: **2 minutes**
- Confirmed → Preparing: **5 minutes**
- Preparing → Ready: **15-30 minutes** (varies by order)

**Responsible:** Admin/Kitchen Manager

---

### SOP-002: Walk-in/Phone Orders (Salesman)

#### **Objective:** Create orders for customers who call or visit

#### **Procedure:**

1. **Customer Greeting**
   - [ ] Greet customer professionally
   - [ ] Ask if they have ordered before
   - [ ] Collect basic information

2. **Order Creation**
   - [ ] Login to salesman dashboard
   - [ ] Click **"New Order"** or **"Create Quick Bill"**
   - [ ] Browse menu or use search bar to find items
   - [ ] Add items to order with quantities

3. **Customer Details Entry**
   - [ ] **Name:** Full name (required)
   - [ ] **Mobile:** 10-digit number (required)
   - [ ] **Email:** Email address (optional)
   - [ ] **Address:** Complete delivery address (required for delivery)
   - [ ] **Delivery Location:** Select from dropdown

4. **Order Review**
   - [ ] Review all items with customer
   - [ ] Confirm quantities
   - [ ] Mention any special instructions
   - [ ] Show total amount including taxes and delivery

5. **Payment Method**
   - [ ] Ask customer preference
   - [ ] Select: Cash on Delivery / Card / UPI / Net Banking
   - [ ] For advance payment, mark as "Paid"

6. **Order Submission**
   - [ ] Click **"Submit Order"** or **"Save & Print"**
   - [ ] Provide Order ID to customer
   - [ ] Print invoice if requested
   - [ ] Inform estimated delivery time

**Timeline:** 3-5 minutes per order

**Responsible:** Salesman/Counter Staff

---

### SOP-003: Order Cancellation

#### **Objective:** Handle order cancellations professionally

#### **Procedure:**

1. **Cancellation Request**
   - Customer calls/messages for cancellation
   - Note: Order ID, customer name, reason

2. **Eligibility Check**
   - [ ] Check current order status
   - [ ] **Pending/Confirmed:** Can cancel immediately
   - [ ] **Preparing:** Check with kitchen if started
   - [ ] **Out for Delivery:** Cannot cancel (offer refund)

3. **Cancellation Process**
   - [ ] Navigate to order details
   - [ ] Click **"Cancel Order"** button
   - [ ] Select cancellation reason from dropdown
   - [ ] Add notes if needed
   - [ ] Confirm cancellation

4. **Refund Processing** (if paid)
   - [ ] For online payments: Initiate refund
   - [ ] For cash: Note refund in cashbook
   - [ ] Provide refund timeline to customer
   - [ ] Update payment status

5. **Customer Communication**
   - [ ] Inform customer of cancellation confirmation
   - [ ] Provide refund details
   - [ ] Apologize for inconvenience
   - [ ] Offer discount on next order (optional)

**Timeline:** 2-3 minutes

**Responsible:** Admin/Customer Service

---

## 🍽️ Menu Management

### SOP-004: Adding New Menu Items

#### **Objective:** Maintain updated and attractive menu

#### **Procedure:**

1. **Preparation**
   - [ ] Prepare high-quality food photograph (800x800px minimum)
   - [ ] Determine accurate pricing
   - [ ] Write appealing description (50-100 words)
   - [ ] Identify correct category
   - [ ] Determine applicable GST rate

2. **Item Creation**
   - [ ] Navigate to **Admin → Menu**
   - [ ] Click **"+ Add Item"** button
   - [ ] Fill in required fields:
     - **Name:** Clear, descriptive name
     - **Price:** Final selling price (₹)
     - **Category:** Select from dropdown
     - **Description:** Appetizing description
     - **GST Rate:** Select applicable rate (usually 5% or 18%)

3. **Image Upload**
   - [ ] Click **"Choose File"** under "Product Image"
   - [ ] Select prepared image file
   - [ ] Wait for preview to appear
   - [ ] Verify image looks good
   - [ ] Image should be clear, well-lit, appetizing

4. **Availability Settings**
   - [ ] Check **"Available for ordering"** if item is in stock
   - [ ] Uncheck if adding for future launch

5. **Save & Verify**
   - [ ] Click **"Add Item"** button
   - [ ] Wait for success confirmation
   - [ ] Verify item appears in menu list
   - [ ] Check customer-facing menu page
   - [ ] Verify image displays correctly

**Quality Checklist:**
- [ ] Image is high quality and appetizing
- [ ] Name is clear and descriptive
- [ ] Price is accurate
- [ ] Description is appealing
- [ ] Category is correct
- [ ] GST rate is appropriate

**Timeline:** 5-10 minutes per item

**Responsible:** Admin/Menu Manager

---

### SOP-005: Updating Menu Items & Images

#### **Objective:** Keep menu information current and accurate

#### **Procedure:**

1. **Locate Item**
   - [ ] Navigate to **Admin → Menu**
   - [ ] Use **search bar** to find item quickly
   - [ ] Type item name, description, or category
   - [ ] Click on the item card

2. **Edit Item**
   - [ ] Click **"Edit"** button on item card
   - [ ] Modal opens with current information
   - [ ] Current image preview is shown

3. **Update Information**
   - [ ] Modify any field as needed:
     - Name, price, description
     - Category, GST rate
     - Availability status

4. **Change Image** (if needed)
   - [ ] **To keep existing image:** Don't select any new file
   - [ ] **To change image:** 
     - Click **"Choose File"**
     - Select new image
     - Preview updates automatically
     - New image will replace old one

5. **Save Changes**
   - [ ] Review all changes
   - [ ] Click **"Update Item"** button
   - [ ] Wait for success message
   - [ ] Verify changes on menu page

**Important Notes:**
- ✅ Existing images are preserved if you don't upload a new one
- ✅ Image upload works correctly for both add and edit
- ✅ Changes reflect immediately on customer menu

**Timeline:** 2-3 minutes per item

**Responsible:** Admin/Menu Manager

---

### SOP-006: Daily Menu Availability Update

#### **Objective:** Ensure menu reflects actual stock availability

#### **Procedure:**

**Morning Check (Before Opening):**

1. **Stock Assessment**
   - [ ] Check kitchen inventory
   - [ ] Identify items that are out of stock
   - [ ] Note items with limited quantity

2. **Menu Update**
   - [ ] Navigate to **Admin → Menu**
   - [ ] Use search bar to quickly find items
   - [ ] For out-of-stock items:
     - Click **"Disable"** button
     - Item marked as unavailable
     - Red badge appears
   - [ ] For available items:
     - Ensure **"Enable"** is active
     - Green badge should show

3. **Verification**
   - [ ] Check customer menu page
   - [ ] Verify unavailable items don't show
   - [ ] Confirm available items display correctly

**During Service:**

4. **Real-time Updates**
   - [ ] When item runs out during service
   - [ ] Immediately mark as unavailable
   - [ ] Inform all staff
   - [ ] Update estimated restock time

**Evening:**

5. **Next Day Planning**
   - [ ] Review items sold out today
   - [ ] Plan procurement for tomorrow
   - [ ] Schedule menu updates

**Timeline:** 10-15 minutes (morning), 1 minute (real-time updates)

**Responsible:** Kitchen Manager/Admin

---

## 📊 Billing & Invoicing

### SOP-007: Generating Customer Invoices

#### **Objective:** Create accurate, GST-compliant invoices

#### **Procedure:**

1. **Order Completion**
   - [ ] Verify order is delivered/completed
   - [ ] Confirm payment status
   - [ ] Check all order details are accurate

2. **Invoice Generation**
   - [ ] Navigate to **Admin → Orders**
   - [ ] Find the completed order
   - [ ] Click **"Generate Invoice"** or **"View Invoice"**

3. **Invoice Verification**
   - [ ] **Header:** Restaurant name, address, GSTIN
   - [ ] **Customer:** Name, phone, address
   - [ ] **Items:** All items with quantities and prices
   - [ ] **Tax Breakdown:** CGST, SGST/IGST rates and amounts
   - [ ] **Total:** Correct final amount
   - [ ] **Payment:** Payment method and status

4. **Invoice Actions**
   - [ ] **Print:** For physical copy
   - [ ] **Download PDF:** For email/records
   - [ ] **Email:** Send to customer (if email provided)
   - [ ] **WhatsApp:** Share via WhatsApp (optional)

5. **Record Keeping**
   - [ ] Invoice automatically saved in system
   - [ ] File physical copy (if printed)
   - [ ] Update accounting records

**Invoice Types:**
- **Tax Invoice:** For GST-registered customers (B2B)
- **Bill of Supply:** For non-GST transactions (B2C)
- **Quick Bill:** For walk-in customers

**Timeline:** 2-3 minutes

**Responsible:** Admin/Billing Staff

---

### SOP-008: Quick Bill Creation (Walk-in Customers)

#### **Objective:** Fast billing for dine-in/takeaway customers

#### **Procedure:**

1. **Access Quick Bill**
   - [ ] Navigate to **Admin → Orders → Create** or
   - [ ] Salesman Dashboard → **"New Order"**

2. **Add Items**
   - [ ] Use search bar to find items quickly
   - [ ] Click **"Add"** for each item
   - [ ] Adjust quantities with +/- buttons
   - [ ] View running total

3. **Customer Information**
   - [ ] **Name:** Customer name (required)
   - [ ] **Mobile:** Phone number (required)
   - [ ] **Email:** Optional
   - [ ] **Address:** Not required for takeaway

4. **Payment**
   - [ ] Select payment method
   - [ ] For cash: Mark as "Paid"
   - [ ] For card/UPI: Process payment and mark as "Paid"

5. **Print Invoice**
   - [ ] Click **"Save & Print"** button
   - [ ] Invoice prints automatically
   - [ ] Provide invoice to customer
   - [ ] Thank customer

**Timeline:** 1-2 minutes

**Responsible:** Counter Staff/Salesman

---

## 🚚 Delivery Management

### SOP-009: Assigning Delivery Boys

#### **Objective:** Efficient delivery assignment and tracking

#### **Procedure:**

1. **Order Ready Notification**
   - [ ] Kitchen marks order as "Ready for Pickup"
   - [ ] Notification appears on admin dashboard

2. **Delivery Boy Selection**
   - [ ] Navigate to order details
   - [ ] Check delivery location
   - [ ] View available delivery boys:
     - Current location (if tracked)
     - Active deliveries count
     - Rating/performance

3. **Assignment**
   - [ ] Select appropriate delivery boy from dropdown
   - [ ] Click **"Assign"** button
   - [ ] Delivery boy receives notification
   - [ ] Order status updates to "Assigned"

4. **Delivery Tracking**
   - [ ] Monitor delivery status
   - [ ] **Picked Up:** Delivery boy collected order
   - [ ] **Out for Delivery:** On the way to customer
   - [ ] **Delivered:** Order completed

5. **Completion**
   - [ ] Delivery boy marks as "Delivered"
   - [ ] Customer receives notification
   - [ ] Commission calculated automatically
   - [ ] COD amount recorded (if applicable)

**Assignment Criteria:**
- Proximity to restaurant/customer
- Current workload
- Performance rating
- Vehicle type (for large orders)

**Timeline:** 1-2 minutes per assignment

**Responsible:** Admin/Dispatch Manager

---

### SOP-010: Delivery Boy Daily Settlement

#### **Objective:** Accurate daily settlement with delivery personnel

#### **Procedure:**

**End of Day:**

1. **Performance Review**
   - [ ] Navigate to **Admin → Delivery Boys**
   - [ ] Select delivery boy
   - [ ] View today's deliveries

2. **Delivery Verification**
   - [ ] Count total deliveries completed
   - [ ] Verify all marked as "Delivered"
   - [ ] Check for any issues/complaints

3. **Cash Collection (COD Orders)**
   - [ ] List all COD orders delivered
   - [ ] Calculate total cash to be collected
   - [ ] Count physical cash from delivery boy
   - [ ] Verify amount matches
   - [ ] Note any discrepancies

4. **Commission Calculation**
   - [ ] System calculates commission automatically
   - [ ] Verify calculation:
     - Fixed per delivery: ₹X × Number of deliveries
     - Percentage: Y% × Total order value
   - [ ] Deduct any advances/penalties

5. **Settlement**
   - [ ] **Cash Settlement:**
     - COD collected - Commission = Amount to restaurant
   - [ ] **Commission Payout:**
     - Pay commission in cash, or
     - Record for monthly payout
   - [ ] Update settlement status in system

6. **Documentation**
   - [ ] Print settlement report
   - [ ] Delivery boy signs acknowledgment
   - [ ] File report
   - [ ] Update cashbook

**Settlement Formula:**
```
COD Collected - Commission Earned = Net Amount to Restaurant
```

**Timeline:** 10-15 minutes per delivery boy

**Responsible:** Admin/Accounts Manager

---

## 📈 Reporting & Analytics

### SOP-011: Daily Sales Report Generation

#### **Objective:** Track daily performance and revenue

#### **Procedure:**

**End of Day:**

1. **Access Reports**
   - [ ] Navigate to **Admin → Reports** or **Dashboard**
   - [ ] Select **"Sales Report"**

2. **Set Parameters**
   - [ ] Date: Today's date
   - [ ] Time: Full day (00:00 to 23:59)
   - [ ] Filters: All categories, all payment methods

3. **Generate Report**
   - [ ] Click **"Generate Report"**
   - [ ] Wait for report to load
   - [ ] Review key metrics:
     - **Total Orders:** Count
     - **Total Revenue:** ₹ amount
     - **Average Order Value:** ₹ amount
     - **Payment Method Breakdown**
     - **Category-wise Sales**

4. **Analysis**
   - [ ] Compare with previous day
   - [ ] Identify best-selling items
   - [ ] Note any unusual patterns
   - [ ] Check for cancelled orders

5. **Export & Save**
   - [ ] Click **"Export to Excel"** or **"Download PDF"**
   - [ ] Save with naming: `Sales_Report_YYYY-MM-DD.xlsx`
   - [ ] Store in reports folder
   - [ ] Share with management (if required)

6. **Action Items**
   - [ ] Note items to restock
   - [ ] Identify slow-moving items
   - [ ] Plan promotions if needed

**Timeline:** 5-10 minutes

**Frequency:** Daily (end of day)

**Responsible:** Admin/Manager

---

### SOP-012: Weekly GST Report

#### **Objective:** Prepare GST compliance reports

#### **Procedure:**

**Every Monday (for previous week):**

1. **Access GST Report**
   - [ ] Navigate to **Admin → GST Report**

2. **Set Date Range**
   - [ ] Start Date: Previous Monday
   - [ ] End Date: Previous Sunday
   - [ ] Click **"Apply"**

3. **Review Report**
   - [ ] **Taxable Amount:** Total before tax
   - [ ] **CGST:** Central GST collected
   - [ ] **SGST:** State GST collected
   - [ ] **IGST:** Integrated GST (if applicable)
   - [ ] **Total Tax:** Sum of all taxes
   - [ ] **Grand Total:** Including taxes

4. **GST Rate-wise Breakdown**
   - [ ] 0% (Exempt items)
   - [ ] 5% (Essential items)
   - [ ] 12% (Processed foods)
   - [ ] 18% (Restaurant services)
   - [ ] Verify calculations

5. **Export for Filing**
   - [ ] Click **"Export to Excel"**
   - [ ] Download **GSTR-1 JSON** (if available)
   - [ ] Save files securely
   - [ ] Share with accountant

6. **Record Keeping**
   - [ ] File digital copy
   - [ ] Maintain backup
   - [ ] Update GST register

**Timeline:** 15-20 minutes

**Frequency:** Weekly

**Responsible:** Accounts Manager/Admin

---

## 💾 Data Backup & Security

### SOP-013: Daily Data Backup

#### **Objective:** Prevent data loss through regular backups

#### **Procedure:**

**End of Day (After closing):**

1. **Access Data Management**
   - [ ] Navigate to **Admin → Data Management**
   - [ ] Click **"Export Data"** tab

2. **Select Data Types**
   - [ ] ✅ Menu Items
   - [ ] ✅ Categories
   - [ ] ✅ Orders (Today's orders)
   - [ ] ✅ Customers
   - [ ] ✅ Delivery Boys
   - [ ] ✅ Salesmen
   - [ ] ✅ Settings

3. **Export Data**
   - [ ] Click **"Export All Data"**
   - [ ] Wait for file generation
   - [ ] Download JSON file
   - [ ] File naming: `Ruchi_Backup_YYYY-MM-DD.json`

4. **Verify Backup**
   - [ ] Check file size (should not be 0 KB)
   - [ ] Open file to verify it's valid JSON
   - [ ] Confirm all data types included

5. **Store Backup**
   - [ ] **Primary:** Save to local computer
   - [ ] **Secondary:** Upload to cloud storage (Google Drive/Dropbox)
   - [ ] **Tertiary:** Copy to external hard drive (weekly)

6. **Backup Rotation**
   - [ ] Keep daily backups for 7 days
   - [ ] Keep weekly backups for 1 month
   - [ ] Keep monthly backups for 1 year
   - [ ] Delete older backups to save space

**Backup Schedule:**
- **Daily:** End of day (automated recommended)
- **Weekly:** Sunday night (full backup)
- **Monthly:** Last day of month (archive)

**Timeline:** 5 minutes

**Responsible:** Admin/IT Manager

---

### SOP-014: Password & Security Management

#### **Objective:** Maintain system security

#### **Procedure:**

**Initial Setup:**

1. **Change Default Passwords**
   - [ ] Admin account: Change from default
   - [ ] Create strong password (12+ characters)
   - [ ] Mix uppercase, lowercase, numbers, symbols
   - [ ] Store securely (password manager)

2. **User Account Creation**
   - [ ] Create unique accounts for each user
   - [ ] Assign appropriate roles:
     - Admin (full access)
     - Salesman (order creation)
     - Delivery Boy (delivery management)
   - [ ] Never share credentials

**Regular Maintenance:**

3. **Password Changes**
   - [ ] Change admin password monthly
   - [ ] Change user passwords quarterly
   - [ ] Update after staff changes

4. **Access Review**
   - [ ] Review active user accounts monthly
   - [ ] Disable accounts for departed staff immediately
   - [ ] Check for suspicious login activity

5. **Security Best Practices**
   - [ ] Always logout after use
   - [ ] Don't save passwords in browser
   - [ ] Use HTTPS only
   - [ ] Don't access from public WiFi
   - [ ] Enable two-factor authentication (if available)

**Timeline:** 15 minutes (monthly review)

**Responsible:** Admin/IT Manager

---

## 🚨 Emergency Procedures

### SOP-015: System Downtime

#### **Objective:** Handle system outages effectively

#### **Procedure:**

**When System is Down:**

1. **Immediate Actions**
   - [ ] Note exact time of outage
   - [ ] Check internet connection
   - [ ] Try different browser/device
   - [ ] Contact technical support

2. **Manual Order Recording**
   - [ ] Use paper order forms
   - [ ] Record: Customer name, phone, items, amount
   - [ ] Number each order sequentially
   - [ ] Calculate totals manually

3. **Customer Communication**
   - [ ] Inform customers of delay
   - [ ] Provide estimated resolution time
   - [ ] Offer alternatives (phone orders)
   - [ ] Apologize for inconvenience

4. **Kitchen Operations**
   - [ ] Continue preparing existing orders
   - [ ] Use manual KOT slips
   - [ ] Maintain order sequence

**When System Restored:**

5. **Data Entry**
   - [ ] Enter all manual orders into system
   - [ ] Verify all details accurate
   - [ ] Update order statuses
   - [ ] Generate invoices

6. **Reconciliation**
   - [ ] Match manual records with system
   - [ ] Verify all payments recorded
   - [ ] Update cashbook

7. **Post-Incident Review**
   - [ ] Document what happened
   - [ ] Identify root cause
   - [ ] Implement preventive measures

**Responsible:** Admin/Manager

---

### SOP-016: Customer Complaint Handling

#### **Objective:** Resolve customer issues professionally

#### **Procedure:**

1. **Receive Complaint**
   - [ ] Listen actively and patiently
   - [ ] Don't interrupt customer
   - [ ] Take notes
   - [ ] Record: Order ID, issue, customer details

2. **Acknowledge & Empathize**
   - [ ] Thank customer for bringing it to attention
   - [ ] Apologize sincerely
   - [ ] Show understanding
   - [ ] Assure resolution

3. **Investigate**
   - [ ] Check order details in system
   - [ ] Verify with kitchen/delivery boy
   - [ ] Review evidence (photos if provided)
   - [ ] Identify root cause

4. **Resolve**
   - **Wrong Item/Missing Item:**
     - [ ] Send correct item immediately
     - [ ] No additional charge
   - **Quality Issue:**
     - [ ] Offer replacement or refund
     - [ ] Discount on next order
   - **Delivery Delay:**
     - [ ] Apologize and explain reason
     - [ ] Offer discount/free item
   - **Billing Error:**
     - [ ] Correct immediately
     - [ ] Process refund if overcharged

5. **Follow-up**
   - [ ] Call customer after resolution
   - [ ] Confirm satisfaction
   - [ ] Offer goodwill gesture
   - [ ] Request feedback

6. **Documentation**
   - [ ] Record complaint in system
   - [ ] Note resolution provided
   - [ ] Identify patterns (if recurring)
   - [ ] Implement preventive measures

**Response Time:**
- Acknowledge: Immediately
- Investigate: Within 15 minutes
- Resolve: Within 1 hour

**Responsible:** Admin/Customer Service Manager

---

## 📝 Appendices

### Appendix A: Quick Reference Checklist

#### **Daily Checklist for Admin**

**Morning:**
- [ ] Login and system check
- [ ] Update menu availability
- [ ] Record opening cash balance
- [ ] Review pending orders
- [ ] Check staff attendance

**During Service:**
- [ ] Monitor incoming orders
- [ ] Assign delivery boys
- [ ] Update order statuses
- [ ] Handle customer queries
- [ ] Manage real-time issues

**Evening:**
- [ ] Generate daily sales report
- [ ] Settle delivery boys
- [ ] Reconcile payments
- [ ] Record closing cash balance
- [ ] Backup data
- [ ] Plan for next day

---

### Appendix B: Contact Information

**Technical Support:**
- Email: support@ruchirestaurant.com
- Phone: [Support Number]
- Hours: 9 AM - 9 PM

**Emergency Contacts:**
- Manager: [Phone]
- Owner: [Phone]
- IT Support: [Phone]
- Accountant: [Phone]

---

### Appendix C: Keyboard Shortcuts

**Admin Panel:**
- `Ctrl + N`: New order
- `Ctrl + M`: Menu management
- `Ctrl + D`: Dashboard
- `Ctrl + S`: Settings
- `Ctrl + B`: Backup data
- `F5`: Refresh page

---

### Appendix D: Troubleshooting Quick Guide

| Issue | Quick Fix |
|-------|-----------|
| Can't login | Clear cache, check credentials |
| Menu not showing | Check availability, refresh page |
| Image not uploading | Check file size (<5MB), format (JPG/PNG) |
| Order not saving | Check internet, verify all required fields |
| Invoice not printing | Check printer connection, try PDF download |
| Search not working | Clear search bar, refresh page |

---

## 📌 Document Control

**Version History:**
- v2.0 - December 2025 - Added search functionality, updated image upload procedures
- v1.5 - November 2025 - Added delivery management SOPs
- v1.0 - October 2025 - Initial SOP document

**Review Schedule:**
- Monthly: Operational procedures
- Quarterly: Emergency procedures
- Annually: Complete document review

**Approval:**
- Prepared by: System Administrator
- Reviewed by: Operations Manager
- Approved by: Restaurant Owner

---

**End of Standard Operating Procedures**

*For questions or suggestions, contact: admin@ruchirestaurant.com*
