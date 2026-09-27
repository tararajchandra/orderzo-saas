# VPS Deployment Quick Start Checklist

## 🎯 Quick Deployment Steps (2-3 hours)

### Phase 1: VPS Initial Setup (30 minutes)

```bash
# 1. Connect to VPS
ssh root@YOUR_VPS_IP

# 2. Update system
apt update && apt upgrade -y

# 3. Create swap (IMPORTANT for 2GB RAM!)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# 4. Configure UFW Firewall
apt install ufw -y
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 25/tcp
ufw allow 587/tcp
ufw allow 465/tcp
ufw allow 993/tcp
ufw allow 143/tcp
ufw allow 8000/tcp
ufw allow 8080/tcp
ufw enable

# 5. Install Fail2Ban (Intrusion Prevention)
apt install fail2ban -y

# Configure Fail2Ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 10m
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 5
bantime = 1h
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Verify security setup
ufw status verbose
fail2ban-client status
```

### Phase 2: Install Coolify (10 minutes)

```bash
# Install Coolify (installs Docker automatically)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Wait for installation to complete
# Then access: http://YOUR_VPS_IP:8000
```

**In Browser:**
1. Go to `http://YOUR_VPS_IP:8000`
2. Create admin account
3. Complete setup wizard

### Phase 3: Install Stalwart Mail Server (20 minutes)

```bash
# 1. Create directory
mkdir -p /opt/stalwart
cd /opt/stalwart

# 2. Create docker-compose.yml
nano docker-compose.yml
```

**Paste this (replace yourdomain.com):**
```yaml
version: '3.8'
services:
  stalwart:
    image: stalwartlabs/mail-server:latest
    container_name: stalwart-mail
    hostname: mail.yourdomain.com
    ports:
      - "25:25"
      - "587:587"
      - "465:465"
      - "143:143"
      - "993:993"
      - "4190:4190"
      - "8080:8080"
    volumes:
      - ./data:/opt/stalwart-mail
    environment:
      - STALWART_DOMAIN=yourdomain.com
    restart: unless-stopped
```

```bash
# 3. Start Stalwart
docker-compose up -d

# 4. Access admin panel: http://YOUR_VPS_IP:8080
# Default login: admin / changeme
# CHANGE PASSWORD IMMEDIATELY!
```

### Phase 4: Configure DNS (15 minutes)

**Add these DNS records in your domain registrar:**

```
Type    Name                    Value               TTL
A       @                       YOUR_VPS_IP         3600
A       mail                    YOUR_VPS_IP         3600
A       app                     YOUR_VPS_IP         3600
MX      @                       mail.yourdomain.com 3600
TXT     @                       v=spf1 mx ~all      3600
TXT     _dmarc                  v=DMARC1; p=none    3600
```

**Wait 10-15 minutes for DNS propagation**

### Phase 5: Deploy App in Coolify (45 minutes)

#### 5.1 Create Database

In Coolify Dashboard:
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Name: `ruchi-db`
3. Database: `restaurant_db`
4. Click **"Create"**
5. **Copy the connection details!**

#### 5.2 Push Code to GitHub

```bash
# On your local machine
cd E:\Project\webDevelop\RuchiV2

# Initialize git (if not already)
git init
git add .
git commit -m "Initial deployment"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ruchi-app.git
git push -u origin main
```

#### 5.3 Deploy Application

In Coolify:
1. Click **"+ New"** → **"Application"**
2. Select **"Public Repository"** or connect GitHub
3. Repository: `https://github.com/YOUR_USERNAME/ruchi-app.git`
4. Branch: `main`
5. Build Pack: `nixpacks` (auto-detected)

#### 5.4 Set Environment Variables

In Coolify → Your App → Environment Variables:

```env
DB_HOST=ruchi-db
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD_FROM_COOLIFY

NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000

JWT_SECRET=GENERATE_RANDOM_STRING_HERE

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@yourdomain.com
```

#### 5.5 Configure Domain

1. In app settings → **"Domains"**
2. Add: `yourdomain.com` or `app.yourdomain.com`
3. Enable **"Auto SSL"** (Let's Encrypt)

#### 5.6 Deploy!

1. Click **"Deploy"**
2. Watch build logs
3. Wait 5-10 minutes

#### 5.7 Run Migrations

After deployment:
1. Go to app → **"Terminal"**
2. Run:
```bash
npm run migrate
npm run create-admin
```

### Phase 6: Verify Everything (15 minutes)

**Checklist:**
- [ ] Visit `https://yourdomain.com` - App loads
- [ ] Login with admin credentials works
- [ ] Database connection works
- [ ] SSL certificate is active (green padlock)
- [ ] Email sending works (test signup)
- [ ] All pages load correctly

## 🔑 Important Credentials to Save

**VPS:**
- IP: `___________________`
- Root Password: `___________________`

**Coolify:**
- URL: `http://YOUR_VPS_IP:8000`
- Email: `___________________`
- Password: `___________________`

**Stalwart Mail:**
- URL: `http://YOUR_VPS_IP:8080`
- Username: `admin`
- Password: `___________________`

**Database:**
- Host: `ruchi-db`
- Database: `restaurant_db`
- User: `postgres`
- Password: `___________________`

**Application:**
- URL: `https://yourdomain.com`
- Admin Email: `___________________`
- Admin Password: `___________________`

## 🚨 Common Issues & Quick Fixes

### Issue: App won't build
```bash
# Check logs in Coolify
# Usually missing environment variables
```

### Issue: Database connection failed
```bash
# Verify DB_HOST is set to service name: ruchi-db
# Check database is running in Coolify
```

### Issue: Out of memory
```bash
# Check swap is active
free -h

# If not, recreate swap:
swapon /swapfile
```

### Issue: SSL not working
```bash
# Wait 5 minutes for Let's Encrypt
# Check domain DNS is pointing to VPS IP
# Verify ports 80 and 443 are open
```

### Issue: Email not sending
```bash
# Check Stalwart is running
docker ps | grep stalwart

# Verify DNS MX record
dig MX yourdomain.com

# Check SMTP credentials in app env vars
```

## 📱 Quick Commands Reference

```bash
# Check all containers
docker ps

# View app logs
docker logs -f ruchi-app

# Check memory usage
free -h
docker stats

# Restart Coolify
systemctl restart coolify

# Restart Stalwart
cd /opt/stalwart
docker-compose restart

# Check firewall
ufw status

# Monitor system
htop
```

## 🎯 Post-Deployment Tasks

1. **Enable Auto-Deploy** in Coolify
2. **Set up daily backups** (Coolify → Database → Backups)
3. **Create email accounts** in Stalwart:
   - noreply@yourdomain.com
   - admin@yourdomain.com
   - support@yourdomain.com
4. **Test all features** thoroughly
5. **Set up monitoring alerts**

## 📚 Full Documentation

For detailed explanations, see: `DEPLOYMENT_VPS_COOLIFY.md`

## ⏱️ Time Estimates

- VPS Setup: 30 min
- Coolify Install: 10 min
- Stalwart Setup: 20 min
- DNS Configuration: 15 min
- App Deployment: 45 min
- Testing: 15 min

**Total: 2-3 hours**

---

**Ready to deploy? Start with Phase 1! 🚀**
