# Login Failed - Troubleshooting Guide

## 🔍 **Diagnose the Issue**

I've created a diagnostic tool to help identify the problem.

### **Step 1: Run Diagnostic Script**

```bash
# Get DATABASE_URL from Railway
export DATABASE_URL="your_railway_database_url"

# Run diagnostic
npm run test-login
```

**This will check:**
- ✅ Database connection
- ✅ Admin user exists
- ✅ Password hash is correct
- ✅ Password verification works
- ✅ All users in database

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Admin User Doesn't Exist**

**Symptoms:**
- Login fails with "Invalid credentials"
- Diagnostic shows "Admin user NOT found"

**Solution:**
```bash
# Create admin user
export DATABASE_URL="your_railway_url"
npm run create-admin
```

Or run this SQL on Railway:
```sql
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@restaurant.com', '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
```

---

### **Issue 2: Wrong Password Hash**

**Symptoms:**
- Admin user exists
- Diagnostic shows "Password is WRONG"

**Solution:**

Run this SQL on Railway:
```sql
UPDATE users 
SET password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'
WHERE email = 'admin@restaurant.com';
```

---

### **Issue 3: Database Not Connected**

**Symptoms:**
- Login fails with 500 error
- Railway logs show database connection errors

**Solution:**

1. **Check Environment Variables in Railway:**
   - Go to RuchiV2 service → Variables
   - Verify these are set:
     ```
     DB_HOST=${{Postgres.PGHOST}}
     DB_PORT=${{Postgres.PGPORT}}
     DB_NAME=${{Postgres.PGDATABASE}}
     DB_USER=${{Postgres.PGUSER}}
     DB_PASSWORD=${{Postgres.PGPASSWORD}}
     ```

2. **Redeploy the app:**
   - Railway → RuchiV2 → Deployments → Redeploy

---

### **Issue 4: Tables Don't Exist**

**Symptoms:**
- Login fails with "relation does not exist"
- Diagnostic shows table errors

**Solution:**

Run database migration:
```bash
export DATABASE_URL="your_railway_url"
npm run migrate
```

Or manually run `database/schema.sql` on Railway.

---

### **Issue 5: Wrong Database**

**Symptoms:**
- App connects but no data
- Different database than expected

**Solution:**

1. **Check which database the app is using:**
   - Railway → PostgreSQL → Connect
   - Copy DATABASE_URL
   - Compare with app's DATABASE_URL

2. **Verify in Railway logs:**
   - Look for "Connected to PostgreSQL database"
   - Check database name

---

## 🔧 **Manual Verification Steps**

### **1. Check Admin User Exists**

Run on Railway PostgreSQL → Data → Query:

```sql
SELECT id, email, name, role, 
       LEFT(password_hash, 20) as hash_preview
FROM users 
WHERE email = 'admin@restaurant.com';
```

**Expected result:**
```
id | email                 | name  | role  | hash_preview
---|----------------------|-------|-------|------------------
1  | admin@restaurant.com | Admin | admin | $2a$10$g/BDopkmH4Ap
```

**If no results:** Admin doesn't exist → Run `npm run create-admin`

---

### **2. Test Password Hash**

The correct hash for "admin123" is:
```
$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im
```

Check if it matches:
```sql
SELECT 
    CASE 
        WHEN password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'
        THEN 'Correct ✅'
        ELSE 'Wrong ❌'
    END as hash_status
FROM users 
WHERE email = 'admin@restaurant.com';
```

**If "Wrong":** Update the hash → See Issue 2 above

---

### **3. Check Database Connection**

On Railway:
1. Go to RuchiV2 service → Deployments
2. Click latest deployment
3. View logs
4. Look for:
   - ✅ "Connected to PostgreSQL database"
   - ❌ "Error connecting to database"

---

### **4. Test Login API Directly**

Use curl or Postman:

```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"admin123"}'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "..."
  }
}
```

**Error responses:**
- `"Invalid credentials"` → User doesn't exist or wrong password
- `"Login failed"` → Database connection issue
- `500 error` → Check Railway logs

---

## 📊 **Checklist**

Go through this checklist:

- [ ] Database tables created (run `npm run migrate`)
- [ ] Admin user exists (run `SELECT * FROM users WHERE email = 'admin@restaurant.com'`)
- [ ] Password hash is correct (see hash above)
- [ ] Environment variables set in Railway
- [ ] App deployed successfully
- [ ] Database connection working (check logs)
- [ ] Using correct DATABASE_URL

---

## 🎯 **Quick Fix Steps**

**If you're not sure what's wrong, do this:**

### **1. Update Admin Password**

Railway → PostgreSQL → Data → Query:

```sql
UPDATE users 
SET password_hash = '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im'
WHERE email = 'admin@restaurant.com';
```

### **2. If No Rows Updated**

Admin doesn't exist. Create it:

```sql
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@restaurant.com', '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im', 'Admin', 'admin');
```

### **3. Verify**

```sql
SELECT email, name, role FROM users WHERE email = 'admin@restaurant.com';
```

Should show 1 row.

### **4. Try Login Again**

- Email: `admin@restaurant.com`
- Password: `admin123`

---

## 🔍 **Still Not Working?**

### **Get More Info:**

1. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Try login
   - Look for errors

2. **Check Railway logs:**
   - Railway → RuchiV2 → Deployments
   - Click latest deployment
   - View logs
   - Look for errors during login

3. **Run diagnostic script:**
   ```bash
   export DATABASE_URL="your_url"
   npm run test-login
   ```

4. **Share the error:**
   - Copy the exact error message
   - Share browser console errors
   - Share Railway log errors

---

## 📝 **Common Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | User doesn't exist or wrong password | Run create-admin script |
| "Login failed" | Database connection error | Check DATABASE_URL in Railway |
| "relation does not exist" | Tables not created | Run migration |
| 500 error | Server error | Check Railway logs |
| Network error | App not deployed | Check deployment status |

---

## ✅ **Expected Working State**

When everything is correct:

1. **Database:**
   - Tables exist
   - Admin user exists
   - Password hash is correct

2. **Railway:**
   - App deployed
   - Environment variables set
   - Connected to PostgreSQL

3. **Login:**
   - Email: admin@restaurant.com
   - Password: admin123
   - ✅ Success!

---

**Need more help?** Run `npm run test-login` and share the output!
