# 🗄️ Database Setup Guide

This guide explains how to set up the database for the Ruchi Restaurant Management System.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Using the JavaScript Script](#using-the-javascript-script)
3. [Using SQL Schema File](#using-sql-schema-file)
4. [Database Structure](#database-structure)
5. [Default Data](#default-data)
6. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- PostgreSQL installed and running
- Node.js installed (for JavaScript method)
- Database credentials configured in `.env.local`

### Environment Variables
Create a `.env.local` file with:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

---

## 💻 Using the JavaScript Script

### Method 1: Automated Setup (Recommended)

**Step 1:** Ensure your `.env.local` file is configured

**Step 2:** Run the database creation script:
```bash
node scripts/create-database.js
```

**What it does:**
- ✅ Creates all tables
- ✅ Creates indexes for performance
- ✅ Inserts default data (admin user, categories, settings, etc.)
- ✅ Provides detailed feedback

**Expected Output:**
```
🚀 Starting database creation...

📋 Creating tables...
✅ Tables created successfully

🔍 Creating indexes...
✅ Indexes created successfully

📝 Inserting default data...
✅ Default data inserted successfully

🎉 Database setup completed successfully!

📊 Summary:
   - Tables: users, categories, menu_items, delivery_locations, orders, invoices, settings, expenses, payouts, images
   - Indexes: Created for optimal query performance
   - Default data: Admin user, categories, settings, delivery locations, sample menu items

📌 Default Admin Credentials:
   Email: admin@restaurant.com
   Password: admin123

⚠️  IMPORTANT: Change the admin password immediately after first login!
```

---

## 📄 Using SQL Schema File

### Method 2: Manual SQL Execution

**Step 1:** Create the database (if not exists):
```bash
createdb restaurant_db
```

**Step 2:** Run the schema file:
```bash
psql restaurant_db < database/schema.sql
```

Or using psql interactive mode:
```bash
psql -U postgres -d restaurant_db
\i database/schema.sql
```

---

## 🗂️ Database Structure

### Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **users** | All user accounts | email, role, commission_rate |
| **categories** | Menu categories | name, sort_order |
| **menu_items** | Menu catalog | name, price, category_id, gst_rate |
| **delivery_locations** | Delivery zones | location_name, delivery_charge |
| **orders** | Customer orders | items (JSONB), total_amount, status |
| **invoices** | Billing invoices | invoice_number, order_id, total |
| **settings** | App configuration | key-value pairs |
| **expenses** | Business expenses | category, amount, expense_date |
| **payouts** | Staff payouts | user_id, amount, payout_date |
| **images** | Menu item images | menu_item_id, image_url |

### Detailed Table Structures

#### 1. **users** Table
```sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- phone (VARCHAR)
- address (TEXT)
- role (VARCHAR) -- 'customer', 'admin', 'delivery', 'salesman'
- commission_rate (DECIMAL)
- commission_type (VARCHAR) -- 'fixed', 'percentage'
- google_id (VARCHAR) -- For OAuth
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 2. **categories** Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR, UNIQUE)
- description (TEXT)
- sort_order (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 3. **menu_items** Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- description (TEXT)
- category_id (INTEGER, FK to categories)
- category (VARCHAR) -- Legacy field
- price (DECIMAL)
- gst_rate (DECIMAL)
- image_data (BYTEA)
- image_type (VARCHAR)
- available (BOOLEAN)
- is_featured (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 4. **delivery_locations** Table
```sql
- id (SERIAL PRIMARY KEY)
- location_name (VARCHAR, UNIQUE)
- delivery_charge (DECIMAL)
- estimated_time (INTEGER) -- minutes
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 5. **orders** Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER, FK to users)
- customer_name, customer_email, customer_phone
- customer_address (TEXT)
- order_type (VARCHAR) -- 'delivery', 'takeaway', 'dine-in'
- table_number (VARCHAR)
- delivery_location_id (INTEGER, FK)
- delivery_charge (DECIMAL)
- delivery_boy_id (INTEGER, FK to users)
- driver_commission (DECIMAL)
- salesman_id (INTEGER, FK to users)
- salesman_commission (DECIMAL)
- items (JSONB) -- Order items array
- subtotal, tax, discount, total_amount (DECIMAL)
- payment_method, payment_status (VARCHAR)
- order_status (VARCHAR)
- notes, cancelled_reason (TEXT)
- created_at, updated_at, delivered_at (TIMESTAMP)
```

#### 6. **invoices** Table
```sql
- id (SERIAL PRIMARY KEY)
- order_id (INTEGER, FK to orders)
- invoice_number (VARCHAR, UNIQUE)
- subtotal, tax, discount, delivery_charge, total (DECIMAL)
- gst_type (VARCHAR)
- generated_at (TIMESTAMP)
```

#### 7. **settings** Table
```sql
- key (VARCHAR, PRIMARY KEY)
- value (TEXT)
- description (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### 8. **expenses** Table
```sql
- id (SERIAL PRIMARY KEY)
- category (VARCHAR)
- description (TEXT)
- amount (DECIMAL)
- payment_method (VARCHAR)
- expense_date (DATE)
- notes (TEXT)
- created_by (INTEGER, FK to users)
- created_at, updated_at (TIMESTAMP)
```

#### 9. **payouts** Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER, FK to users)
- amount (DECIMAL)
- payout_date (DATE)
- payment_method (VARCHAR)
- notes (TEXT)
- created_by (INTEGER, FK to users)
- created_at (TIMESTAMP)
```

#### 10. **images** Table
```sql
- id (SERIAL PRIMARY KEY)
- menu_item_id (INTEGER, FK to menu_items)
- image_url (TEXT)
- is_primary (BOOLEAN)
- created_at (TIMESTAMP)
```

---

## 📊 Default Data

### Default Admin User
```
Email: admin@restaurant.com
Password: admin123
```
⚠️ **Change this password immediately after first login!**

### Default Categories
- APPETIZERS
- MAIN COURSE
- BREADS
- RICE
- DESSERTS
- BEVERAGES

### Default Settings
- Restaurant name, address, phone, email
- GST configuration
- Printer settings
- Invoice settings
- Currency settings

### Default Delivery Locations
- City Center (₹30)
- North Zone (₹50)
- South Zone (₹50)
- East Zone (₹60)
- West Zone (₹60)
- Suburbs (₹80)
- Airport Area (₹100)

### Sample Menu Items
- Paneer Tikka (₹250)
- Chicken Biryani (₹350)
- Dal Makhani (₹200)
- Butter Naan (₹50)
- Gulab Jamun (₹80)
- Mango Lassi (₹100)

---

## 🔍 Indexes

Performance indexes are created on:
- User email, role, active status
- Category sort order, active status
- Menu items category, availability, featured status
- Order user_id, created_at, status, payment_status
- Delivery boy and salesman assignments
- Invoice order_id, generated_at
- Expense date and category
- Payout user_id and date

---

## 🔧 Troubleshooting

### Connection Errors

**Problem:** Cannot connect to database
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Ensure PostgreSQL is running:
   ```bash
   # Windows
   pg_ctl status
   
   # Linux/Mac
   sudo service postgresql status
   ```

2. Check your `.env.local` credentials
3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Permission Errors

**Problem:** Permission denied
```
Error: permission denied for database
```

**Solutions:**
1. Ensure your database user has proper permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO your_user;
   ```

2. Check if user can create tables:
   ```sql
   GRANT CREATE ON SCHEMA public TO your_user;
   ```

### Table Already Exists

**Problem:** Tables already exist

**Solutions:**
- The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times
- To start fresh, drop the database and recreate:
  ```bash
  dropdb restaurant_db
  createdb restaurant_db
  node scripts/create-database.js
  ```

### Migration Conflicts

**Problem:** Need to apply migrations after schema creation

**Solution:**
- Run migrations in order from `database/migrations/` folder
- Or use the schema.sql which includes all migrations

---

## 📝 Maintenance

### Backup Database
```bash
pg_dump restaurant_db > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql restaurant_db < backup_20251212.sql
```

### Reset Database
```bash
dropdb restaurant_db
createdb restaurant_db
node scripts/create-database.js
```

### View Database Size
```sql
SELECT pg_size_pretty(pg_database_size('restaurant_db'));
```

---

## 🔐 Security Notes

1. **Change Default Password:** Immediately change the admin password after setup
2. **Secure Credentials:** Never commit `.env.local` to version control
3. **Use Strong Passwords:** Use bcrypt for password hashing
4. **Regular Backups:** Schedule automated database backups
5. **Limit Permissions:** Grant minimum required permissions to database users

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Module](https://node-postgres.com/)
- [Main README](../README.md)
- [User Help Guide](../USER_HELP_GUIDE.md)

---

## ✅ Verification Checklist

After setup, verify:
- [ ] All tables created successfully
- [ ] Indexes created
- [ ] Default admin user exists
- [ ] Categories populated
- [ ] Settings configured
- [ ] Delivery locations added
- [ ] Can login with admin credentials
- [ ] Database connection works from app

---

**Last Updated:** December 12, 2025  
**Version:** 2.0
