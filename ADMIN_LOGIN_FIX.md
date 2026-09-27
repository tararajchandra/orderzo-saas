# Admin Login Fix - Railway Deployment

## ❌ **Problem**
Login failed with default admin credentials:
- Email: `admin@restaurant.com`
- Password: `admin123`

## 🔍 **Root Cause**
The bcrypt password hash in `database/schema.sql` was a placeholder, not a real hash of "admin123".

## ✅ **Solution Applied**

### **1. Fixed schema.sql**
Updated with proper bcrypt hash:
```sql
-- Old (placeholder):
'$2a$10$rKvVPZqGJf5YqH5YqH5YqOqH5YqH5YqH5YqH5YqH5YqH5YqH5Yq'

-- New (real hash of 'admin123'):
'$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'
```

### **2. Created Admin User Script**
Created `scripts/create-admin.js` to create/update admin user with proper password.

---

## 🚀 **How to Fix on Railway**

### **Option 1: Update Admin Password via Query (FASTEST)**

1. Go to Railway → **PostgreSQL service** → **Data** → **Query**

2. Run this SQL:
```sql
UPDATE users 
SET password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'
WHERE email = 'admin@restaurant.com';
```

3. Click **Run**

4. Verify:
```sql
SELECT email, name, role FROM users WHERE email = 'admin@restaurant.com';
```

5. **Try logging in again!**
   - Email: `admin@restaurant.com`
   - Password: `admin123`

---

### **Option 2: Run create-admin Script**

1. **Get DATABASE_URL from Railway**
   - PostgreSQL service → Connect → Copy `DATABASE_URL`

2. **Run locally:**
```bash
export DATABASE_URL="your_railway_database_url"
npm run create-admin
```

3. **Script will:**
   - Connect to Railway database
   - Update admin password
   - Show success message

---

### **Option 3: Re-run Migration with Fixed Schema**

1. **Drop and recreate users table:**
```sql
DROP TABLE IF EXISTS users CASCADE;
```

2. **Re-run schema.sql** (with fixed hash)
   - PostgreSQL service → Data → Query
   - Paste entire `database/schema.sql`
   - Click Run

⚠️ **Warning**: This will delete all existing users!

---

## 🔐 **Admin Credentials**

After fix:

```
Email:    admin@restaurant.com
Password: admin123
```

**⚠️ Change this password after first login!**

---

## 📝 **For Future Deployments**

The schema.sql is now fixed in your GitHub repository. Future deployments will have the correct password hash.

---

## 🧪 **Test Login**

1. Go to your Railway app URL
2. Navigate to `/admin`
3. Login with:
   - Email: `admin@restaurant.com`
   - Password: `admin123`
4. ✅ Should work now!

---

## 🛠️ **If Still Not Working**

### **Check if admin user exists:**
```sql
SELECT * FROM users WHERE email = 'admin@restaurant.com';
```

**If no results:**
- Admin user doesn't exist
- Run: `npm run create-admin`

**If user exists but login fails:**
- Password hash is wrong
- Run Option 1 (UPDATE query) above

### **Check password verification:**

The login API (`app/api/auth/login/route.ts`) uses bcrypt.compare():
```typescript
const isValid = await bcrypt.compare(password, user.password_hash);
```

This should work with the new hash.

---

## 📊 **What Changed**

| File | Change |
|------|--------|
| `database/schema.sql` | Fixed bcrypt hash |
| `scripts/create-admin.js` | New script to create/update admin |
| `package.json` | Added `npm run create-admin` command |

---

## 🎯 **Quick Fix Summary**

**Fastest solution:**

1. Railway → PostgreSQL → Data → Query
2. Run:
   ```sql
   UPDATE users 
   SET password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'
   WHERE email = 'admin@restaurant.com';
   ```
3. Try login again!

---

## ✅ **Verification**

After running the fix:

```sql
-- This should return 1 row
SELECT email, name, role, 
       CASE 
           WHEN password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im' 
           THEN 'Correct hash ✅'
           ELSE 'Wrong hash ❌'
       END as hash_status
FROM users 
WHERE email = 'admin@restaurant.com';
```

**Expected result:**
```
email                   | name  | role  | hash_status
------------------------|-------|-------|---------------
admin@restaurant.com    | Admin | admin | Correct hash ✅
```

---

**Status**: ✅ Fixed  
**Action Required**: Run UPDATE query on Railway PostgreSQL  
**Time**: 30 seconds  
**Last Updated**: December 12, 2025 23:15 IST
