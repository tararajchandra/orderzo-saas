# Railway Migration - Quick Reference

## 🚀 Quick Start (Recommended Method)

```bash
# 1. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link your project
railway link

# 4. Run migration
railway run npm run migrate

# 5. Verify migration
railway run npm run verify-migration
```

## ✅ What Gets Added

- **discount** column (DECIMAL) - For manual discounts
- **order_number** column (VARCHAR) - For daily sequential order numbers

## 📋 Alternative Methods

### Method A: Railway Dashboard
1. Go to Railway Dashboard → Your Service → Settings
2. Temporarily change start command to: `npm run migrate && npm start`
3. Redeploy
4. Change back to: `npm start`

### Method B: Direct SQL
1. Railway Dashboard → PostgreSQL → Data → Query
2. Run:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;
```

## 🔍 Verification Commands

```bash
# Check if migration completed
railway run npm run verify-migration

# View all columns in orders table
railway run node -e "const {Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});await c.connect();const r=await c.query(\"SELECT column_name FROM information_schema.columns WHERE table_name='orders'\");console.log(r.rows.map(r=>r.column_name));await c.end();})()"

# Check Railway logs
railway logs
```

## ⚠️ Troubleshooting

| Error | Solution |
|-------|----------|
| "column already exists" | ✅ Ignore - column was already added |
| "DATABASE_URL not set" | Use `railway run` command |
| "Connection refused" | Check PostgreSQL is running in Railway |
| Migration runs but columns missing | Check logs for errors, verify correct database |

## 📁 Files Modified

- ✅ `scripts/migrate-railway.js` - Updated to run additional migrations
- ✅ `scripts/verify-migration.js` - New verification script
- ✅ `package.json` - Added verify-migration script
- ✅ `database/migrations/001_add_discount_column.sql` - Discount migration
- ✅ `database/migrations/002_add_order_number_column.sql` - Order number migration

## 🎯 After Migration

1. Restart Railway service (automatic on redeploy)
2. Test creating an order with discount
3. Verify invoice shows discount line
4. Check order numbers are generated

## 💡 Pro Tips

- Run migration during low traffic
- Railway automatically backs up before migrations
- Use `verify-migration` to confirm success
- Keep migration scripts in version control

## 🆘 Need Help?

See full guide: `RAILWAY_MIGRATION_GUIDE.md`

---

**Ready to migrate?** Run: `railway run npm run migrate` 🚀
