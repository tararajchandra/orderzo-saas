# Check Railway Database Users - Quick Guide

## 🎯 **Quick Steps**

### **Step 1: Get Your DATABASE_URL from Railway**

1. Go to [Railway Dashboard](https://railway.app)
2. Click on your **PostgreSQL** service (not RuchiV2)
3. Go to **Connect** tab
4. Copy the **DATABASE_URL** (starts with `postgresql://`)

### **Step 2: Run the Check Script**

Open PowerShell in your project directory and run:

```powershell
# Set the DATABASE_URL (replace with your actual URL)
$env:DATABASE_URL="postgresql://postgres:password@host:port/database"

# Run the check
npm run check-users
```

### **Step 3: Interpret the Results**

The script will tell you:
- ✅ If users exist in the database
- ✅ If the admin user exists
- ✅ If the password hash is correct
- ❌ What to do if something is wrong

---

## 📋 **Possible Outcomes**

### **Outcome 1: No Users Found**

**What you'll see:**
```
❌ NO USERS FOUND in the database!
```

**Solution:**
Run this SQL on Railway → PostgreSQL → Data → Query:

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@restaurant.com',
  '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im',
  'Admin',
  'admin'
);
```

Then login with:
- Email: `admin@restaurant.com`
- Password: `admin123`

---

### **Outcome 2: Users Exist, But No Admin**

**What you'll see:**
```
⚠️ No admin@restaurant.com user found!
```

**Solution:**
Run this SQL on Railway:

```sql
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@restaurant.com',
  '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im',
  'Admin',
  'admin'
);
```

---

### **Outcome 3: Admin Exists, Wrong Password**

**What you'll see:**
```
⚠️ Password hash is DIFFERENT!
```

**Solution:**
Run this SQL on Railway:

```sql
UPDATE users
SET password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'
WHERE email = 'admin@restaurant.com';
```

---

### **Outcome 4: Everything is Correct!**

**What you'll see:**
```
✅ Admin user exists!
✅ Password hash is CORRECT!
```

**If login still fails:**
1. Check browser console (F12) for errors
2. Check Railway deployment logs
3. Verify environment variables in Railway
4. Clear browser cache and cookies
5. Make sure you're using the correct URL

---

## 🔧 **Alternative: Check Directly on Railway**

You can also check directly on Railway without running the script:

1. Go to Railway → **PostgreSQL** → **Data** → **Query**
2. Run this SQL:

```sql
SELECT id, email, name, role, 
       LEFT(password_hash, 30) as hash_preview
FROM users 
ORDER BY id;
```

3. Check the results:
   - If empty → No users exist
   - If admin@restaurant.com exists → Check if hash starts with `$2a$10$g/BDopkmH4ApGpJfgmCXMe`

---

## 📝 **Expected Admin User Details**

When everything is correct, you should see:

```
Email: admin@restaurant.com
Name: Admin
Role: admin
Password Hash: $2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im
```

**Login Credentials:**
- Email: `admin@restaurant.com`
- Password: `admin123`

---

## 🆘 **Still Having Issues?**

If the script shows everything is correct but login still fails:

1. **Check Railway Logs:**
   - Railway → RuchiV2 service → Deployments → Latest → View Logs
   - Look for errors during login attempts

2. **Check Browser Console:**
   - Open your app in browser
   - Press F12 to open DevTools
   - Go to Console tab
   - Try to login and check for errors

3. **Verify Environment Variables:**
   - Railway → RuchiV2 service → Variables
   - Make sure these are set:
     ```
     DB_HOST=${{Postgres.PGHOST}}
     DB_PORT=${{Postgres.PGPORT}}
     DB_NAME=${{Postgres.PGDATABASE}}
     DB_USER=${{Postgres.PGUSER}}
     DB_PASSWORD=${{Postgres.PGPASSWORD}}
     ```

4. **Redeploy:**
   - Railway → RuchiV2 → Settings → Redeploy

---

## ✅ **Success Checklist**

- [ ] Script shows admin user exists
- [ ] Password hash is correct
- [ ] Can login with admin@restaurant.com / admin123
- [ ] Redirected to admin dashboard after login

---

**Need help?** Share the output of `npm run check-users` for more specific guidance!
