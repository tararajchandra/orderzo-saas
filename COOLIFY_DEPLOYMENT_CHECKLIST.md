# Coolify Deployment Checklist for Ruchi Restaurant App

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [x] PostgreSQL database created in Coolify
- [x] Database name: `restaurant_db`
- [x] Connection string obtained
- [ ] Update `.env.production.coolify` with actual DATABASE_URL

### 2. Environment Variables Preparation
- [ ] Generate new JWT_SECRET for production
- [ ] Set admin email and secure password
- [ ] Configure domain name
- [ ] (Optional) Set up Google OAuth credentials
- [ ] (Optional) Set up Google Maps API key

### 3. Code Preparation
- [ ] All changes committed to Git
- [ ] `.gitignore` properly configured
- [ ] `.dockerignore` in place
- [ ] `nixpacks.toml` configured
- [ ] Database schema and migrations ready

### 4. GitHub Repository
- [ ] Code pushed to GitHub
- [ ] Repository is public OR GitHub App connected to Coolify
- [ ] Main branch is up to date

---

## 🚀 Deployment Steps in Coolify

### Step 1: Create Application

1. In Coolify dashboard, click **"+ New"** → **"New Resource"**
2. Choose:
   - **Public Repository** (if repo is public)
   - **Private Repository (with GitHub App)** (if repo is private)

### Step 2: Configure Repository

- **Repository URL:** `https://github.com/YOUR_USERNAME/RuchiV2`
- **Branch:** `main`
- **Build Pack:** `nixpacks` (auto-detected)

### Step 3: Set Environment Variables

Copy all variables from `.env.production.coolify` to Coolify's Environment Variables section:

```env
DATABASE_URL=postgresql://postgres:yQEEeolK8zx2nrXkasqF9Zb73J4BzE4Gf6jmynci4XR8R3pU33lcREYYgdWYeJen@hk40so4k0ws80g8gk8ogo8g8:5432/restaurant_db
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
JWT_SECRET=YOUR_GENERATED_SECRET
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD
```

### Step 4: Configure Build Settings

Coolify will auto-detect from `nixpacks.toml`:
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Port:** `3000`

### Step 5: Configure Domain (Optional)

- Add your domain: `yourdomain.com` or `app.yourdomain.com`
- Coolify will automatically set up SSL with Let's Encrypt

### Step 6: Deploy

1. Click **"Deploy"**
2. Watch the build logs
3. First deployment takes 5-10 minutes

---

## 📋 Post-Deployment Steps

### Step 1: Run Database Migrations

After successful deployment:

1. In Coolify, go to your app → **"Terminal"**
2. Run migrations:
   ```bash
   npm run migrate
   ```

### Step 2: Create Admin User

In the terminal:
```bash
npm run create-admin
```

### Step 3: Verify Deployment

1. Visit your domain: `https://yourdomain.com`
2. Try logging in with admin credentials
3. Test all features:
   - [ ] Admin login works
   - [ ] Menu items display
   - [ ] Orders can be created
   - [ ] Database is accessible

### Step 4: Test Import/Export

1. Log into admin panel
2. Go to Settings → Data Management
3. Test export functionality
4. Save the export as your first backup

---

## 🔧 Troubleshooting

### Build Fails

**Check:**
- Environment variables are set correctly
- DATABASE_URL is correct
- Node version matches (18.x)

**Solution:**
```bash
# In Coolify terminal
npm install
npm run build
```

### Database Connection Error

**Check:**
- DATABASE_URL format is correct
- Database service is running
- Service name matches (hk40so4k0ws80g8gk8ogo8g8)

**Solution:**
- Verify connection string in Coolify database settings
- Restart database service

### Migration Fails

**Check:**
- Database is accessible
- Migrations folder exists
- Schema.sql is present

**Solution:**
```bash
# In Coolify terminal
node scripts/migrate-railway.js
```

---

## 📝 Important Notes

### Database Connection
- Use the **internal Docker hostname** from Coolify
- Format: `postgresql://user:password@hostname:5432/database`
- Don't use `localhost` or external IPs

### Environment Variables
- Never commit `.env` files to Git
- Always use Coolify's Environment Variables section
- Generate new secrets for production

### Backups
- Use Coolify's built-in database backups (daily recommended)
- Also use app's import/export feature for data backups
- Store backups in multiple locations

### Security
- Change default admin password immediately
- Use strong JWT_SECRET
- Enable HTTPS (automatic with Coolify)
- Keep dependencies updated

---

## 🎯 Quick Commands Reference

### In Coolify Terminal:

```bash
# Run migrations
npm run migrate

# Create admin user
npm run create-admin

# Check users
npm run check-users

# Verify migration
npm run verify-migration

# View logs
npm run start
```

### Check Application Status:

```bash
# Check if app is running
ps aux | grep node

# Check memory usage
free -h

# Check disk space
df -h
```

---

## ✅ Deployment Complete Checklist

- [ ] Application deployed successfully
- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Can log in to admin panel
- [ ] Menu items visible
- [ ] Orders working
- [ ] Import/export tested
- [ ] First backup created
- [ ] Domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Monitoring set up in Coolify

---

## 🎉 Success!

Your Ruchi Restaurant app should now be:
- ✅ Running on your VPS via Coolify
- ✅ Connected to PostgreSQL database
- ✅ Accessible via HTTPS
- ✅ Protected by firewall and Fail2Ban
- ✅ Ready for production use

**Next Steps:**
1. Share the URL with your team
2. Set up regular backups
3. Monitor resource usage
4. Add more features as needed

---

**Need Help?** Check:
- Coolify Docs: https://coolify.io/docs
- Application logs in Coolify dashboard
- Database logs in Coolify
- `TROUBLESHOOTING_VPS_SIMPLIFIED.md` in your repo
