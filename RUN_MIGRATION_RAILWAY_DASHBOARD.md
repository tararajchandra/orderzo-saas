# Run Migration via Railway Dashboard

## 🎯 Quick Steps to Make Customer Details Optional

Since you don't have Railway CLI installed, follow these steps to run the migration directly in the Railway dashboard:

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Open Railway Dashboard**

1. Go to [Railway Dashboard](https://railway.app/)
2. Login to your account
3. Select your **RuchiV2** project

### **Step 2: Open PostgreSQL Database**

1. Click on your **Postgres** service (the database icon)
2. Click on the **"Data"** tab at the top
3. You should see a query interface

### **Step 3: Run the Migration SQL**

Copy and paste this SQL into the query box:

```sql
-- Make customer_name and customer_phone nullable
ALTER TABLE orders 
ALTER COLUMN customer_name DROP NOT NULL,
ALTER COLUMN customer_phone DROP NOT NULL;

-- Add default values for better data quality
UPDATE orders 
SET customer_name = 'Walk-in Customer' 
WHERE customer_name IS NULL OR customer_name = '';

UPDATE orders 
SET customer_phone = 'N/A' 
WHERE customer_phone IS NULL OR customer_phone = '';
```

### **Step 4: Execute the Query**

1. Click the **"Execute"** or **"Run"** button
2. Wait for the query to complete
3. You should see a success message

---

## ✅ **Verification**

After running the migration, verify it worked:

1. In the same query interface, run:
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('customer_name', 'customer_phone');
```

2. You should see:
   - `customer_name` → `is_nullable: YES`
   - `customer_phone` → `is_nullable: YES`

---

## 🧪 **Test the Changes**

### Test 1: Salesperson Dine-in Order (No Customer Details)
1. Go to your app URL
2. Login as salesperson
3. Select **"Dine-in"** order type
4. Enter table number (e.g., "T-5")
5. Add items to cart
6. **Leave customer name and phone empty**
7. Click "Place Order"
8. ✅ **Expected:** Order created successfully!

### Test 2: Delivery Order (Customer Details Required)
1. Select **"Delivery"** order type
2. Try to place order without customer details
3. ✅ **Expected:** Validation error asking for customer details
4. Fill in customer name and phone
5. ✅ **Expected:** Order created successfully

---

## 🔍 **Alternative: Using Railway's Query Tab**

If you don't see a "Data" tab:

1. In Railway dashboard, click on **Postgres** service
2. Look for **"Query"** tab or **"Connect"** button
3. If there's a **"Connect"** button:
   - Click it
   - Select **"psql"** or **"Query"**
   - Paste the SQL from Step 3
   - Execute

---

## 🆘 **Troubleshooting**

### Can't Find Query Interface?

**Option A: Use Railway's Web Terminal**
1. Click on Postgres service
2. Look for a terminal/console icon
3. Type: `psql`
4. Paste the SQL commands one by one

**Option B: Use a Database Client**
1. Download [TablePlus](https://tableplus.com/) or [DBeaver](https://dbeaver.io/)
2. Get connection details from Railway:
   - Railway → Postgres → Connect → Copy connection string
3. Connect using the client
4. Run the SQL migration

---

## 📸 **What You're Looking For**

In Railway Dashboard → Postgres service, you should see one of these:

- **"Data"** tab - Has a query editor
- **"Query"** tab - Has a query editor  
- **"Connect"** button - Shows connection options including web query

---

## ✨ **After Migration is Complete**

Once you've successfully run the migration:

1. ✅ Salesperson can create dine-in orders without customer details
2. ✅ Salesperson can create takeaway orders without customer details
3. ✅ Delivery orders still require customer details (as they should)

---

## 💡 **Quick Copy-Paste**

Here's the migration SQL again for easy copying:

```sql
ALTER TABLE orders ALTER COLUMN customer_name DROP NOT NULL, ALTER COLUMN customer_phone DROP NOT NULL;
UPDATE orders SET customer_name = 'Walk-in Customer' WHERE customer_name IS NULL OR customer_name = '';
UPDATE orders SET customer_phone = 'N/A' WHERE customer_phone IS NULL OR customer_phone = '';
```

---

**Need help? Let me know which tab/option you see in your Railway Postgres service!**
