# Railway Environment Variables Setup

## 🎯 Quick Fix for Login Issue

Your database is set up correctly, but your app can't connect to it. Follow these steps:

---

## 📋 **Step-by-Step Instructions**

### **Step 1: Go to RuchiV2 Service**

1. In Railway dashboard, click on **RuchiV2** (your app service, NOT Postgres)
2. Click on **Variables** tab at the top

### **Step 2: Add Database Connection Variables**

Click **"New Variable"** button and add these **5 variables**:

#### Variable 1:
- **Key:** `DB_HOST`
- **Value:** `${{Postgres.PGHOST}}`

#### Variable 2:
- **Key:** `DB_PORT`
- **Value:** `${{Postgres.PGPORT}}`

#### Variable 3:
- **Key:** `DB_NAME`
- **Value:** `${{Postgres.PGDATABASE}}`

#### Variable 4:
- **Key:** `DB_USER`
- **Value:** `${{Postgres.PGUSER}}`

#### Variable 5:
- **Key:** `DB_PASSWORD`
- **Value:** `${{Postgres.PGPASSWORD}}`

**Important Notes:**
- ✅ Use the EXACT syntax: `${{Postgres.PGHOST}}` (with double curly braces)
- ✅ Railway will automatically replace these with actual values
- ✅ Make sure "Postgres" matches your Postgres service name

### **Step 3: Save Variables**

After adding all 5 variables, they should be automatically saved.

### **Step 4: Redeploy Your App**

1. Go to **Deployments** tab (in RuchiV2 service)
2. Find the latest deployment
3. Click the **three dots (...)** menu
4. Click **"Redeploy"**
5. Wait for deployment to complete (usually 2-3 minutes)

### **Step 5: Test Login**

1. Go to your app URL
2. Navigate to `/admin` or `/login`
3. Login with:
   - **Email:** `admin@restaurant.com`
   - **Password:** `admin123`

---

## ✅ **Verification Checklist**

- [ ] Added DB_HOST variable
- [ ] Added DB_PORT variable
- [ ] Added DB_NAME variable
- [ ] Added DB_USER variable
- [ ] Added DB_PASSWORD variable
- [ ] Redeployed the app
- [ ] Waited for deployment to complete
- [ ] Tested login

---

## 🔍 **How to Check Deployment Status**

In Railway → RuchiV2 → Deployments:
- ⏳ **Building** - Wait...
- ⏳ **Deploying** - Wait...
- ✅ **Active** - Ready to test!

---

## 🆘 **If Login Still Fails**

1. **Check Deployment Logs:**
   - Railway → RuchiV2 → Deployments → Latest → View Logs
   - Look for database connection errors

2. **Verify Variables:**
   - Railway → RuchiV2 → Variables
   - Make sure all 5 variables are there

3. **Check Database Connection:**
   - Look for logs like "✅ Connected to PostgreSQL database"
   - If you see "❌ Error connecting to database", variables are wrong

---

## 📝 **Expected Success**

When everything works, you should see in the logs:
```
✅ Connected to PostgreSQL database
```

And login should work immediately!

---

## 🎯 **Summary**

**Problem:** App can't connect to database (500 error on login)  
**Solution:** Add database environment variables to RuchiV2 service  
**Result:** Login works! ✅

---

**After you complete these steps, let me know if login works!**
