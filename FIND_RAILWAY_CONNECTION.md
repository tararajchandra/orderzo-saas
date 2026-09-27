# Railway Database Setup Guide

## 🎯 Quick Setup Instructions

Based on your Railway variables, here's how to set up your database:

### **Step 1: Find Your Connection String**

In Railway, go to your **Postgres** service → **Connect** tab (look for a button that says "Connect" near the top).

You should see a connection string that looks like:
```
postgresql://postgres:LhYuIDJdfZGTKzLCENCzcwrjkfgkNSTA@some-domain.railway.app:12345/railway
```

### **Step 2: Copy the PUBLIC Connection URL**

Look for **"Public URL"** or **"External URL"** - this is what you need to connect from your local machine.

### **Step 3: Run Migration**

Open PowerShell in your project directory:

```powershell
# Set the DATABASE_URL (paste the connection string you copied)
$env:DATABASE_URL="postgresql://postgres:LhYuIDJdfZGTKzLCENCzcwrjkfgkNSTA@your-domain:port/railway"

# Run the migration
npm run migrate
```

---

## 🔍 **Alternative: Find RAILWAY_TCP_PROXY_DOMAIN**

If you can't find the Connect tab, scroll down in the **Variables** tab to find:
- `RAILWAY_TCP_PROXY_DOMAIN` (something like `xyz.proxy.rlwy.net`)
- `RAILWAY_TCP_PROXY_PORT` (a port number)

Then your DATABASE_URL will be:
```
postgresql://postgres:LhYuIDJdfZGTKzLCENCzcwrjkfgkNSTA@[RAILWAY_TCP_PROXY_DOMAIN]:[RAILWAY_TCP_PROXY_PORT]/railway
```

---

## ✅ **What the Migration Will Do**

Once you run `npm run migrate`, it will:
1. ✅ Create all database tables (users, orders, menu_items, etc.)
2. ✅ Create admin user (admin@restaurant.com / admin123)
3. ✅ Add default categories
4. ✅ Add default settings
5. ✅ Add sample delivery locations

Then you can login to your app!

---

## 🆘 **Still Stuck?**

Take a screenshot of the Railway **Connect** tab or tell me the values of:
- RAILWAY_TCP_PROXY_DOMAIN
- RAILWAY_TCP_PROXY_PORT

And I'll construct the exact command for you!
