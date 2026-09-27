# Deployment Guide - Ruchi Restaurant App

This guide will help you deploy your Ruchi Restaurant application to various hosting platforms.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ All code committed to a Git repository (GitHub, GitLab, or Bitbucket)
- ✅ PostgreSQL database ready (or will use hosted database)
- ✅ Environment variables documented
- ✅ Application tested locally

---

## 🚀 Recommended Hosting Options

### Option 1: Vercel (Recommended for Next.js) ⭐

**Best for:** Quick deployment, automatic scaling, free tier available

#### Step 1: Prepare Your App

1. **Create `vercel.json` in root directory:**
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["bom1"]
}
```

2. **Update `package.json` scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

#### Step 2: Set Up Database

**Option A: Use Vercel Postgres**
1. Go to Vercel Dashboard → Storage → Create Database
2. Select PostgreSQL
3. Note the connection details

**Option B: Use External PostgreSQL (Recommended)**
- **Neon** (https://neon.tech) - Free tier, serverless PostgreSQL
- **Supabase** (https://supabase.com) - Free tier with additional features
- **Railway** (https://railway.app) - Simple PostgreSQL hosting

#### Step 3: Deploy to Vercel

**Method 1: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set project name
# - Configure build settings
```

**Method 2: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your Git repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Step 4: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=ruchi_restaurant
DB_USER=your-username
DB_PASSWORD=your-password
ADMIN_EMAIL=admin@ruchi.com
ADMIN_PASSWORD=your-secure-password
NEXT_PUBLIC_API_URL=https://your-app.vercel.app
```

#### Step 5: Run Database Migrations

After deployment, run migrations:
```bash
# Connect to your production database and run:
# 1. schema.sql
# 2. All migration files in database/migrations/
```

---

### Option 2: Railway 🚂

**Best for:** Full-stack apps with database included

#### Step 1: Deploy to Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository

#### Step 2: Add PostgreSQL

1. In your project, click "New" → "Database" → "PostgreSQL"
2. Railway automatically creates database and provides connection URL

#### Step 3: Configure Environment Variables

Railway auto-detects Next.js. Add these variables:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
ADMIN_EMAIL=admin@ruchi.com
ADMIN_PASSWORD=your-secure-password
```

#### Step 4: Configure Build

Railway auto-detects Next.js settings. If needed, customize:
- Build Command: `npm run build`
- Start Command: `npm start`

---

### Option 3: Netlify 🌐

**Best for:** Static sites and serverless functions

#### Step 1: Prepare for Netlify

1. **Create `netlify.toml` in root:**
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

#### Step 2: Deploy

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to Git provider
4. Select repository
5. Configure build settings (auto-detected)

#### Step 3: Add Environment Variables

In Site Settings → Environment Variables, add all your `.env.local` variables.

#### Step 4: Database

Use external PostgreSQL (Neon, Supabase, or Railway)

---

### Option 4: DigitalOcean App Platform 🌊

**Best for:** More control, scalable infrastructure

#### Step 1: Create App

1. Go to https://cloud.digitalocean.com
2. Create → Apps → GitHub
3. Select repository

#### Step 2: Configure App

- **Type:** Web Service
- **Build Command:** `npm run build`
- **Run Command:** `npm start`
- **HTTP Port:** 3000

#### Step 3: Add Database

1. In same project, add "Database" component
2. Choose PostgreSQL
3. Link to your app

#### Step 4: Environment Variables

Add in App Settings → Environment Variables

---

## 🗄️ Database Setup Options

### Option 1: Neon (Recommended) ⚡

**Free Tier:** 0.5 GB storage, serverless PostgreSQL

1. Go to https://neon.tech
2. Sign up and create project
3. Create database: `ruchi_restaurant`
4. Get connection string
5. Run migrations using provided connection string

**Connection String Format:**
```
postgresql://user:password@host/ruchi_restaurant?sslmode=require
```

### Option 2: Supabase 🔋

**Free Tier:** 500 MB database, 2 GB bandwidth

1. Go to https://supabase.com
2. Create new project
3. Go to Database → SQL Editor
4. Run your schema.sql and migrations
5. Get connection details from Settings → Database

### Option 3: Railway Database 🚂

**Free Tier:** $5 credit/month

1. Included with Railway deployment
2. Auto-configured connection
3. Easy to manage from dashboard

---

## 📝 Pre-Deployment Checklist

### 1. Code Preparation
```bash
# Test production build locally
npm run build
npm start

# Check for errors
npm run lint

# Test all features
```

### 2. Environment Variables

Create `.env.production` with:
```env
# Database
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=ruchi_restaurant
DB_USER=your-username
DB_PASSWORD=your-secure-password

# Admin Credentials
ADMIN_EMAIL=admin@ruchi.com
ADMIN_PASSWORD=your-secure-password

# App URL
NEXT_PUBLIC_API_URL=https://your-domain.com
```

### 3. Database Migrations

Run in order:
1. `database/schema.sql`
2. `database/migrations/create_categories_table.sql`
3. `database/migrations/add_category_foreign_key.sql`
4. `database/migrations/add_gst_rate_to_menu_items.sql`
5. Any other migration files

### 4. Security Checklist

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Enable HTTPS (auto on Vercel/Netlify)
- [ ] Set up CORS if needed
- [ ] Review environment variables
- [ ] Enable database backups

---

## 🔧 Post-Deployment Steps

### 1. Verify Deployment

```bash
# Check if site is live
curl https://your-app-url.com

# Test API endpoints
curl https://your-app-url.com/api/menu
```

### 2. Run Database Migrations

**Using psql:**
```bash
psql "your-connection-string" -f database/schema.sql
psql "your-connection-string" -f database/migrations/create_categories_table.sql
# ... run all migrations
```

**Using database GUI:**
- Use TablePlus, pgAdmin, or DBeaver
- Connect to production database
- Run SQL files manually

### 3. Create Admin User

```sql
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@ruchi.com', 'your-hashed-password', 'Admin', 'admin');
```

### 4. Test All Features

- [ ] Admin login
- [ ] Menu management
- [ ] Order creation
- [ ] Invoice generation
- [ ] WhatsApp sharing
- [ ] GST report
- [ ] Theme toggle

---

## 🌐 Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records
4. SSL auto-configured

### Railway
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS CNAME record
4. SSL auto-configured

---

## 📊 Monitoring & Maintenance

### 1. Set Up Monitoring

**Vercel:**
- Built-in analytics
- Real-time logs in dashboard

**External Options:**
- Sentry (error tracking)
- LogRocket (session replay)
- Google Analytics

### 2. Database Backups

**Neon:** Automatic backups
**Supabase:** Point-in-time recovery
**Railway:** Automatic backups

**Manual Backup:**
```bash
pg_dump "your-connection-string" > backup-$(date +%Y%m%d).sql
```

### 3. Regular Updates

```bash
# Update dependencies
npm update

# Check for security issues
npm audit

# Deploy updates
git push origin main
```

---

## 🆘 Troubleshooting

### Build Fails

**Error:** "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error:** "Build timeout"
- Increase build timeout in platform settings
- Optimize build process

### Database Connection Issues

**Error:** "Connection refused"
- Check database is running
- Verify connection string
- Check firewall/security groups
- Ensure SSL mode is correct

**Error:** "Too many connections"
- Use connection pooling
- Reduce max connections in code

### Environment Variables Not Working

- Ensure variables are set in hosting platform
- Restart deployment after adding variables
- Check variable names match exactly
- For Next.js public variables, use `NEXT_PUBLIC_` prefix

---

## 💰 Cost Estimates

### Free Tier Options
- **Vercel:** Free for personal projects
- **Netlify:** Free for personal projects  
- **Neon:** Free 0.5GB database
- **Supabase:** Free 500MB database

### Paid Options (Monthly)
- **Vercel Pro:** $20/month
- **Railway:** Pay as you go (~$5-20)
- **DigitalOcean:** $12-25/month
- **Neon Scale:** $19/month

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Neon Documentation](https://neon.tech/docs)

---

## ✅ Quick Start (Recommended Path)

**For fastest deployment:**

1. **Push code to GitHub**
2. **Sign up for Vercel** (https://vercel.com)
3. **Sign up for Neon** (https://neon.tech)
4. **Import project to Vercel**
5. **Add environment variables**
6. **Run database migrations**
7. **Test your live app!**

**Total time:** ~30 minutes

---

Need help? Check the troubleshooting section or contact support for your chosen platform.
