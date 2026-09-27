# Deploying Ruchi Restaurant App with Namecheap

Since you have Namecheap, here are your best options:

---

## 🎯 **Recommended Approach: Namecheap Domain + Vercel Hosting**

This is the **BEST** solution - use Namecheap for your domain and Vercel for hosting.

### **Why This Works Best:**
- ✅ Namecheap shared hosting doesn't support Next.js
- ✅ Vercel is FREE and optimized for Next.js
- ✅ Easy to connect your Namecheap domain to Vercel
- ✅ Automatic HTTPS and global CDN

---

## 📋 **Step-by-Step Guide**

### **Part 1: Deploy to Vercel (Free)**

#### Step 1: Push Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub, then:
git remote add origin https://github.com/yourusername/ruchi-restaurant.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Sign up with GitHub (free)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. Click "Deploy"

#### Step 3: Set Up Database (Neon - Free)
1. Go to https://neon.tech
2. Create account (free)
3. Create project: "Ruchi Restaurant"
4. Create database: `ruchi_restaurant`
5. Copy connection string

#### Step 4: Add Environment Variables in Vercel
Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:
```
DB_HOST=your-neon-host.neon.tech
DB_PORT=5432
DB_NAME=ruchi_restaurant
DB_USER=your-username
DB_PASSWORD=your-password
ADMIN_EMAIL=admin@ruchi.com
ADMIN_PASSWORD=your-secure-password
```

#### Step 5: Run Database Migrations
Connect to Neon database and run:
1. `database/schema.sql`
2. All files in `database/migrations/`

---

### **Part 2: Connect Your Namecheap Domain to Vercel**

#### Step 1: Get Vercel DNS Records
1. In Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `ruchi-restaurant.com`)
4. Vercel will show you DNS records to add

**You'll see something like:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### Step 2: Update DNS in Namecheap
1. Log in to Namecheap
2. Go to "Domain List"
3. Click "Manage" next to your domain
4. Go to "Advanced DNS" tab
5. Delete existing A and CNAME records for @ and www
6. Add new records from Vercel:

**Add A Record:**
- Type: `A Record`
- Host: `@`
- Value: `76.76.21.21` (use the IP Vercel gave you)
- TTL: `Automatic`

**Add CNAME Record:**
- Type: `CNAME Record`
- Host: `www`
- Value: `cname.vercel-dns.com` (use the value Vercel gave you)
- TTL: `Automatic`

#### Step 3: Wait for DNS Propagation
- DNS changes can take 5 minutes to 48 hours
- Usually works within 30 minutes
- Check status in Vercel dashboard

#### Step 4: Verify SSL Certificate
- Vercel automatically provisions SSL certificate
- Your site will be available at:
  - `https://yourdomain.com`
  - `https://www.yourdomain.com`

---

## 🔄 **Alternative: Use Namecheap VPS (If You Have One)**

If you have a Namecheap VPS (not shared hosting), you can deploy directly:

### **Requirements:**
- Namecheap VPS or Dedicated Server
- SSH access
- Root/sudo privileges

### **Deployment Steps:**

#### Step 1: Connect to Your VPS
```bash
ssh root@your-vps-ip
```

#### Step 2: Install Node.js
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node -v
npm -v
```

#### Step 3: Install PostgreSQL
```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE ruchi_restaurant;
CREATE USER ruchi_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE ruchi_restaurant TO ruchi_user;
\q
```

#### Step 4: Install PM2 (Process Manager)
```bash
npm install -g pm2
```

#### Step 5: Clone and Deploy Your App
```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/ruchi-restaurant.git
cd ruchi-restaurant

# Install dependencies
npm install

# Create .env.production
nano .env.production
# Add your environment variables

# Build application
npm run build

# Start with PM2
pm2 start npm --name "ruchi-restaurant" -- start
pm2 save
pm2 startup
```

#### Step 6: Install and Configure Nginx
```bash
# Install Nginx
apt install -y nginx

# Create Nginx configuration
nano /etc/nginx/sites-available/ruchi-restaurant
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/ruchi-restaurant /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### Step 7: Install SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
```

---

## 💰 **Cost Comparison**

### **Option 1: Namecheap Domain + Vercel (Recommended)**
- **Domain:** ~$10-15/year (Namecheap)
- **Hosting:** FREE (Vercel)
- **Database:** FREE (Neon)
- **Total:** **~$10-15/year**

### **Option 2: Namecheap VPS**
- **Domain:** ~$10-15/year
- **VPS:** ~$15-30/month (Namecheap VPS)
- **Total:** **~$180-360/year**

**Recommendation:** Use Option 1 unless you need VPS for other reasons.

---

## 🎯 **Quick Setup (Recommended Path)**

1. **Keep your Namecheap domain** ✅
2. **Deploy to Vercel** (free) ✅
3. **Use Neon for database** (free) ✅
4. **Point domain to Vercel** ✅

**Total Time:** 30-60 minutes
**Total Cost:** Just your domain (~$10-15/year)

---

## 📝 **DNS Configuration Quick Reference**

### **For Vercel Deployment:**

In Namecheap Advanced DNS, add:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | Automatic |
| CNAME | www | cname.vercel-dns.com | Automatic |

**Note:** Use the actual values Vercel provides in your dashboard.

---

## 🆘 **Troubleshooting**

### **Domain Not Working After DNS Update**

**Issue:** Site not loading after adding DNS records

**Solutions:**
1. **Wait for DNS propagation** (up to 48 hours, usually 30 min)
2. **Check DNS propagation:** https://dnschecker.org
3. **Clear browser cache:** Ctrl+Shift+Delete
4. **Try incognito mode**
5. **Verify DNS records in Namecheap:** Advanced DNS tab

### **SSL Certificate Not Working**

**Issue:** "Not Secure" warning in browser

**Solutions:**
1. Wait for Vercel to provision certificate (automatic)
2. Ensure both @ and www records are added
3. Check Vercel dashboard for SSL status
4. May take up to 24 hours for first-time setup

### **App Not Loading**

**Issue:** Domain points to Vercel but app doesn't load

**Solutions:**
1. Check Vercel deployment status
2. Verify environment variables are set
3. Check Vercel logs for errors
4. Ensure build completed successfully

---

## ✅ **Recommended Setup Checklist**

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project deployed to Vercel
- [ ] Neon database created
- [ ] Database migrations run
- [ ] Environment variables added to Vercel
- [ ] Domain added in Vercel dashboard
- [ ] DNS records updated in Namecheap
- [ ] SSL certificate verified
- [ ] App tested at custom domain

---

## 📚 **Additional Resources**

- **Vercel + Custom Domain:** https://vercel.com/docs/concepts/projects/domains
- **Namecheap DNS Guide:** https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain
- **Neon Documentation:** https://neon.tech/docs/introduction

---

## 🎉 **Summary**

**Best Solution for Namecheap Users:**
1. Use Namecheap for **domain only**
2. Use Vercel for **hosting** (free)
3. Use Neon for **database** (free)
4. Connect domain via DNS records

This gives you:
- ✅ Professional custom domain
- ✅ Free, fast hosting
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Easy deployments
- ✅ Minimal cost

**You get enterprise-grade hosting for just the cost of your domain!** 🚀
