# Railway Database Setup Guide

## 🗄️ How to Create Tables in Railway PostgreSQL

Your RuchiV2 app needs database tables to work. Here's how to set them up on Railway.

---

## 📋 **Option 1: Using Railway's Web Terminal (Recommended)**

### **Step 1: Add PostgreSQL Service**

1. Go to your Railway project
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway creates a PostgreSQL database
4. Note the connection details

### **Step 2: Connect Your App to Database**

Railway automatically creates these environment variables:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

**Update your app's environment variables:**

1. Click on your **RuchiV2 service**
2. Go to **"Variables"** tab
3. Add these variables:

```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=Q+xLsho6BM8vCyId0z20oG340mI6PB2H3VurOt733Eg=
```

**Note**: Railway uses `${{Postgres.VARIABLE}}` syntax to reference PostgreSQL variables.

### **Step 3: Run Database Migrations**

#### **Method A: Using psql Command (Easiest)**

1. Click on your **PostgreSQL service**
2. Go to **"Data"** tab
3. Click **"Query"** button
4. Copy and paste the entire contents of `database/schema.sql`
5. Click **"Run"**

#### **Method B: Using Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to PostgreSQL
railway run psql $DATABASE_URL -f database/schema.sql
```

---

## 📋 **Option 2: Using Database Migration Script**

### **Create a Migration Script**

Create `scripts/migrate-railway.js`:

```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Railway PostgreSQL');

        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        await client.query(schema);
        console.log('✅ Database schema created successfully!');

        // Verify tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('\n📊 Created tables:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
```

### **Add to package.json:**

```json
{
  "scripts": {
    "migrate": "node scripts/migrate-railway.js"
  }
}
```

### **Run Migration:**

```bash
# Set DATABASE_URL from Railway
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Run migration
npm run migrate
```

---

## 📋 **Option 3: Using Railway's Build Command**

### **Add to package.json:**

```json
{
  "scripts": {
    "build": "next build && npm run migrate:prod",
    "migrate:prod": "node scripts/migrate-railway.js"
  }
}
```

Railway will run migrations automatically after each deployment!

---

## 🔍 **Verify Tables Were Created**

### **Method 1: Railway Dashboard**

1. Go to **PostgreSQL service**
2. Click **"Data"** tab
3. Click **"Query"**
4. Run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- categories
- delivery_locations
- expenses
- images
- invoices
- menu_items
- orders
- payouts
- settings
- users

### **Method 2: Using psql**

```bash
railway run psql $DATABASE_URL -c "\dt"
```

---

## 📊 **Your Database Schema**

Your `database/schema.sql` creates these tables:

| Table | Purpose |
|-------|---------|
| `users` | Customers, admins, delivery boys, salesmen |
| `categories` | Menu categories |
| `menu_items` | Restaurant menu |
| `images` | Product images |
| `orders` | Customer orders |
| `invoices` | Billing invoices |
| `delivery_locations` | Delivery zones |
| `expenses` | Business expenses |
| `payouts` | Staff payouts |
| `settings` | App configuration |

---

## ⚙️ **Complete Setup Steps**

### **1. Add PostgreSQL to Railway**

```
Railway Dashboard → New → Database → PostgreSQL
```

### **2. Configure Environment Variables**

In your RuchiV2 service:

```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=your_jwt_secret_here
```

### **3. Run Database Schema**

**Option A - Web Interface:**
- PostgreSQL service → Data → Query
- Paste `database/schema.sql` contents
- Click Run

**Option B - CLI:**
```bash
railway run psql $DATABASE_URL -f database/schema.sql
```

### **4. Verify Setup**

```sql
-- Check tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return 10 tables

-- Check default data
SELECT * FROM categories;
SELECT * FROM users WHERE role = 'admin';
```

### **5. Redeploy App**

```
Railway Dashboard → RuchiV2 → Deployments → Redeploy
```

---

## 🚨 **Troubleshooting**

### **Error: "relation does not exist"**

**Cause**: Tables not created  
**Solution**: Run schema.sql again

### **Error: "password authentication failed"**

**Cause**: Wrong database credentials  
**Solution**: Check environment variables match PostgreSQL service

### **Error: "SSL connection required"**

**Cause**: Railway requires SSL  
**Solution**: Add to connection:

```javascript
ssl: {
    rejectUnauthorized: false
}
```

---

## 📝 **Quick Command Reference**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run migrations
railway run psql $DATABASE_URL -f database/schema.sql

# Check tables
railway run psql $DATABASE_URL -c "\dt"

# Query data
railway run psql $DATABASE_URL -c "SELECT * FROM users;"
```

---

## 🎯 **Recommended Approach**

**For First Time Setup:**

1. ✅ Add PostgreSQL service in Railway
2. ✅ Configure environment variables
3. ✅ Use Railway's web Query interface
4. ✅ Paste entire `schema.sql` content
5. ✅ Click Run
6. ✅ Verify tables created
7. ✅ Redeploy app

**For Future Updates:**

1. Create migration files in `database/migrations/`
2. Run them via Railway CLI or web interface
3. Keep track of which migrations have been run

---

## 📚 **Files You Need**

- `database/schema.sql` - Main database schema ✅ (you have this)
- `database/migrations/*.sql` - Individual migrations ✅ (you have these)

---

## ✅ **Checklist**

- [ ] PostgreSQL service added to Railway
- [ ] Environment variables configured
- [ ] Database schema executed
- [ ] Tables verified (10 tables)
- [ ] Default data exists (admin user, categories)
- [ ] App redeployed
- [ ] App connects to database successfully

---

## 🚀 **Next Steps After Setup**

1. **Test the app** - Visit your Railway URL
2. **Login as admin** - Email: `admin@restaurant.com`, Password: `admin123`
3. **Add menu items** - Upload products with images
4. **Test orders** - Create a test order
5. **Import data** - Use the data import feature if you have existing data

---

**Need help?** Let me know which method you want to use and I'll guide you through it! 🎯
