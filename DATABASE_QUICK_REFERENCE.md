# 📊 Database Schema Quick Reference

## 🗂️ Tables Summary

| # | Table | Records | Purpose |
|---|-------|---------|---------|
| 1 | users | Multi-role | Customers, admins, delivery boys, salesmen |
| 2 | categories | ~6-20 | Menu categories |
| 3 | menu_items | ~50-500 | Restaurant menu catalog |
| 4 | delivery_locations | ~5-20 | Delivery zones with charges |
| 5 | orders | Growing | Customer orders |
| 6 | invoices | Growing | Billing invoices |
| 7 | settings | ~10-20 | App configuration |
| 8 | expenses | Growing | Business expenses |
| 9 | payouts | Growing | Staff payouts |
| 10 | images | Optional | Additional menu images |

---

## 🔑 Primary Keys & Relationships

```
users (id)
  ├── orders (user_id) - Customer orders
  ├── orders (delivery_boy_id) - Delivery assignments
  ├── orders (salesman_id) - Sales tracking
  ├── expenses (created_by) - Expense creator
  └── payouts (user_id, created_by) - Payout records

categories (id)
  └── menu_items (category_id) - Menu categorization

menu_items (id)
  └── images (menu_item_id) - Additional images

delivery_locations (id)
  └── orders (delivery_location_id) - Delivery zone

orders (id)
  └── invoices (order_id) - Generated invoices
```

---

## 📋 Field Types Reference

### Common Fields
```sql
id                  SERIAL PRIMARY KEY
created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Money Fields
```sql
price               DECIMAL(10, 2)  -- ₹9999999.99
commission_rate     DECIMAL(10, 2)
gst_rate            DECIMAL(5, 2)   -- 99.99%
```

### Status Fields
```sql
is_active           BOOLEAN DEFAULT true
available           BOOLEAN DEFAULT true
```

### User Roles
```sql
role VARCHAR(20)
  - 'customer'
  - 'admin'
  - 'delivery'
  - 'salesman'
```

### Order Status
```sql
order_status VARCHAR(50)
  - 'pending'
  - 'confirmed'
  - 'preparing'
  - 'out_for_delivery'
  - 'delivered'
  - 'cancelled'
```

### Payment Status
```sql
payment_status VARCHAR(50)
  - 'pending'
  - 'paid'
  - 'failed'
```

### Payment Methods
```sql
payment_method VARCHAR(50)
  - 'cash'
  - 'card'
  - 'upi'
  - 'netbanking'
```

### Order Types
```sql
order_type VARCHAR(20)
  - 'delivery'
  - 'takeaway'
  - 'dine-in'
```

---

## 🔍 Important Indexes

```sql
-- Performance critical indexes
idx_orders_created_at       -- Date range queries
idx_orders_status           -- Status filtering
idx_menu_items_available    -- Active menu items
idx_users_role              -- Role-based queries
idx_orders_delivery_boy     -- Delivery assignments
```

---

## 📝 Sample Queries

### Get Active Menu Items by Category
```sql
SELECT m.*, c.name as category_name
FROM menu_items m
LEFT JOIN categories c ON m.category_id = c.id
WHERE m.available = true
ORDER BY c.sort_order, m.name;
```

### Get Today's Orders
```sql
SELECT *
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

### Get Pending Deliveries for Delivery Boy
```sql
SELECT *
FROM orders
WHERE delivery_boy_id = $1
  AND order_status IN ('confirmed', 'preparing', 'out_for_delivery')
ORDER BY created_at;
```

### Calculate Today's Revenue
```sql
SELECT 
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  SUM(tax) as total_tax
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
  AND payment_status = 'paid';
```

### Get Delivery Boy Earnings
```sql
SELECT 
  u.name,
  COUNT(o.id) as deliveries,
  SUM(o.driver_commission) as total_commission
FROM users u
LEFT JOIN orders o ON u.id = o.delivery_boy_id
WHERE u.role = 'delivery'
  AND o.order_status = 'delivered'
  AND DATE(o.delivered_at) = CURRENT_DATE
GROUP BY u.id, u.name;
```

---

## 🔐 Default Credentials

```
Admin Login:
  Email: admin@restaurant.com
  Password: admin123
  
⚠️ CHANGE IMMEDIATELY AFTER FIRST LOGIN!
```

---

## 💾 Quick Commands

### Create Database
```bash
createdb restaurant_db
```

### Run Schema
```bash
psql restaurant_db < database/schema.sql
```

### Run JS Script
```bash
node scripts/create-database.js
```

### Backup
```bash
pg_dump restaurant_db > backup.sql
```

### Restore
```bash
psql restaurant_db < backup.sql
```

### Connect
```bash
psql -U postgres -d restaurant_db
```

---

## 📊 JSONB Structure

### Order Items (orders.items)
```json
[
  {
    "id": 1,
    "name": "Paneer Tikka",
    "price": 250.00,
    "quantity": 2,
    "gst_rate": 5.00,
    "total": 500.00
  },
  {
    "id": 2,
    "name": "Butter Naan",
    "price": 50.00,
    "quantity": 4,
    "gst_rate": 5.00,
    "total": 200.00
  }
]
```

### Query JSONB
```sql
-- Get orders containing specific item
SELECT *
FROM orders
WHERE items @> '[{"id": 1}]';

-- Extract item quantities
SELECT 
  id,
  jsonb_array_elements(items)->>'name' as item_name,
  (jsonb_array_elements(items)->>'quantity')::int as quantity
FROM orders;
```

---

## 🎯 Common Settings Keys

```
restaurant_name
restaurant_address
restaurant_phone
restaurant_email
gst_number
gst_type           -- 'regular', 'composite', 'unregistered'
printer_type       -- 'thermal', 'a4'
paper_width        -- '80mm', '58mm'
show_logo          -- 'true', 'false'
footer_text
tax_rate           -- '5.00'
currency           -- 'INR'
currency_symbol    -- '₹'
```

---

## 🔄 Migration Order

If applying migrations manually:
1. create_categories_table.sql
2. create_settings_table.sql
3. create_images_table.sql
4. create_expenses_table.sql
5. add_category_foreign_key.sql
6. add_gst_rate_to_menu_items.sql
7. 007_add_delivery_locations.sql
8. add_delivery_boy_to_orders.sql
9. add_delivery_commission.sql
10. add_order_type.sql
11. add_table_number_to_orders.sql
12. add_payouts_table.sql
13. add_google_id.sql
14. clean_financials.sql

---

**Print this for quick desk reference!**

*Last Updated: December 2025*
