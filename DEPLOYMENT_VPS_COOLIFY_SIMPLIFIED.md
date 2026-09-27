# VPS Deployment Guide: Coolify (Simplified)

This guide will help you deploy your Ruchi Restaurant app on a VPS (2 Core CPU, 2GB RAM) using Coolify.

## 📋 Prerequisites

- ✅ VPS with 2 Core CPU and 2GB RAM
- ✅ Ubuntu 22.04 or 24.04 LTS (recommended)
- ✅ Root or sudo access
- ✅ Domain name (e.g., `yourdomain.com`)
- ✅ SSH access to your VPS

## 🚀 Part 1: Initial VPS Setup

### Step 1: Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Update System

```bash
apt update && apt upgrade -y
```

### Step 3: Create a Swap File (Important for 2GB RAM)

Since you have only 2GB RAM, creating swap space is crucial:

```bash
# Create 2GB swap file
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

# Verify swap
free -h
```

### Step 4: Set Up UFW Firewall

**Note:** We'll install UFW now and Fail2Ban later (after Coolify) since Fail2Ban needs Nginx logs.

#### 4.1: Configure UFW Firewall

UFW controls which ports are accessible from the internet.

```bash
# Install UFW
apt install ufw -y

# Set default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (CRITICAL - do this first!)
ufw allow 22/tcp

# Allow web traffic
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Allow Coolify dashboard (if accessing remotely)
ufw allow 8000/tcp

# Enable firewall
ufw enable

# Verify status
ufw status verbose
```

**Security Notes:**
- ✅ UFW blocks all ports except those explicitly allowed
- ⚠️ Always allow SSH (port 22) BEFORE enabling UFW
- ⚠️ Save your IP before enabling strict rules
- ℹ️ We'll install Fail2Ban after Coolify (in Part 2.5)

## 🐳 Part 2: Install Coolify

Coolify is a self-hosted Heroku/Netlify/Vercel alternative that makes deployment easy.

### Step 1: Install Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

This will:
- Install Docker and Docker Compose
- Install Coolify
- Set up the Coolify dashboard
- Start Coolify services

**Installation takes 5-10 minutes**

### Step 2: Access Coolify Dashboard

1. Open your browser and go to: `http://your-vps-ip:8000`
2. You'll see the Coolify setup wizard
3. Create your admin account:
   - Email: your-email@domain.com
   - Password: (choose a strong password)
   - Name: Your Name

### Step 3: Configure Coolify

1. **Set up your domain** (if you have one):
   - Go to Settings → Configuration
   - Add your domain (e.g., `coolify.yourdomain.com`)
   - Coolify will automatically set up SSL with Let's Encrypt

## 🛡️ Part 2.5: Install Fail2Ban (After Coolify)

Now that Coolify has installed Nginx, we can set up Fail2Ban to monitor both SSH and web traffic.

### Step 1: Install and Configure Fail2Ban

```bash
# Install Fail2Ban
apt install fail2ban -y

# Create local configuration file
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban settings
bantime = 10m
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 5
bantime = 1h
findtime = 10m

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

# Start and enable Fail2Ban
systemctl enable fail2ban
systemctl start fail2ban

# Check status
fail2ban-client status
fail2ban-client status sshd
```

**Expected output:**
```
Status
|- Number of jail:      5
`- Jail list:   nginx-badbots, nginx-botsearch, nginx-http-auth, nginx-noscript, sshd
```

### Step 2: Verify Fail2Ban Setup

```bash
# Check UFW status
ufw status numbered

# Check Fail2Ban status
fail2ban-client status

# Check SSH jail
fail2ban-client status sshd

# View banned IPs (if any)
fail2ban-client get sshd banned
```

### Step 3: Monitor Security

```bash
# View UFW logs
tail -f /var/log/ufw.log

# View Fail2Ban logs
tail -f /var/log/fail2ban.log

# View SSH authentication attempts
tail -f /var/log/auth.log

# Check for failed login attempts
grep "Failed password" /var/log/auth.log | tail -20
```

### Step 4: Useful Fail2Ban Commands

```bash
# Unban an IP (if you accidentally locked yourself out)
fail2ban-client set sshd unbanip YOUR_IP

# Ban an IP manually
fail2ban-client set sshd banip MALICIOUS_IP

# Reload Fail2Ban configuration
fail2ban-client reload

# Get all banned IPs across all jails
fail2ban-client banned
```

**Security Notes:**
- ✅ UFW blocks all ports except those explicitly allowed
- ✅ Fail2Ban now monitors both SSH and Nginx logs
- ✅ IPs are banned after 5 failed SSH attempts for 1 hour
- ✅ Web attacks (bad bots, scripts) are also blocked
- ⚠️ Make sure you have your IP whitelisted if needed

## 🎯 Part 3: Deploy Ruchi App with Coolify

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already):
   ```bash
   # In your local project directory
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ruchi-app.git
   git push -u origin main
   ```

2. **Make sure you have a `.gitignore`** file:
   ```
   node_modules/
   .next/
   .env
   .env.local
   *.log
   ```

### Step 2: Create PostgreSQL Database in Coolify

1. In Coolify dashboard, click **"+ New"** → **"Database"**
2. Select **"PostgreSQL"**
3. Configure:
   - Name: `ruchi-db`
   - Version: `16` (latest stable)
   - Database Name: `restaurant_db`
   - Username: `postgres`
   - Password: (auto-generated or set your own)
4. Click **"Create"**
5. Wait for the database to start
6. **Note down the connection details** (you'll need these)

### Step 3: Deploy the App

1. In Coolify, click **"+ New"** → **"Application"**

2. **Select Source**:
   - Choose "Public Repository" or connect your GitHub account
   - Repository URL: `https://github.com/yourusername/ruchi-app.git`
   - Branch: `main`

3. **Configure Build Settings**:
   - Build Pack: `nixpacks` (auto-detected for Next.js)
   - Port: `3000`
   - Build Command: `npm run build`
   - Start Command: `npm start`

4. **Set Environment Variables**:
   Click on "Environment Variables" and add:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://postgres:your-db-password@ruchi-db:5432/restaurant_db
   
   # Application
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NODE_ENV=production
   PORT=3000
   
   # JWT Secret (generate a strong random string)
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   
   # Google OAuth (if using)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Google Maps API (if using)
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

5. **Configure Domain**:
   - Add your domain: `yourdomain.com` or `app.yourdomain.com`
   - Coolify will automatically set up SSL with Let's Encrypt

6. **Deploy**:
   - Click **"Deploy"**
   - Watch the build logs
   - First deployment takes 5-10 minutes

### Step 4: Run Database Migrations

After the first deployment:

1. In Coolify, go to your app → **"Terminal"**
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Seed initial data (if needed):
   ```bash
   npx prisma db seed
   ```

### Step 5: Test Your Deployment

1. Visit your domain: `https://yourdomain.com`
2. Try logging in with admin credentials
3. Test all features

## 🔧 Part 4: Post-Deployment Configuration

### Configure Automatic Deployments

1. In Coolify, go to your app settings
2. Enable **"Auto Deploy"**
3. Now every push to `main` branch will trigger a deployment

### Set Up Monitoring

1. In Coolify dashboard → **"Monitoring"**
2. Enable resource monitoring
3. Set up alerts for:
   - High CPU usage (>80%)
   - High memory usage (>90%)
   - Disk space (>80%)

### Configure Database Backups

1. In Coolify, go to your database → **"Backups"**
2. Configure:
   - Frequency: Daily
   - Retention: 7 days
   - Time: 2:00 AM (low traffic time)

**Note:** Your app has built-in import/export functionality, so you can also create manual backups through the admin panel.

### Optimize for 2GB RAM

Since you have limited RAM, optimize your setup:

1. **Limit Docker Memory**:
   ```bash
   # Edit /etc/docker/daemon.json
   cat > /etc/docker/daemon.json << 'EOF'
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   EOF
   
   systemctl restart docker
   ```

2. **Monitor Resources**:
   ```bash
   # Install htop for monitoring
   apt install htop -y
   
   # Check memory usage
   free -h
   docker stats
   ```

## 🔐 Security Best Practices

### 1. Verify Security Setup

```bash
# Verify UFW is active
sudo ufw status verbose

# Verify Fail2Ban is running
sudo systemctl status fail2ban
sudo fail2ban-client status

# Check for banned IPs
sudo fail2ban-client banned
```

### 2. Disable Root SSH Login (Recommended)

**IMPORTANT:** Only do this after setting up SSH key authentication!

```bash
# First, create a non-root user
adduser deploy
usermod -aG sudo deploy

# Set up SSH key for new user
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Test login as new user BEFORE disabling root
# ssh deploy@your-vps-ip

# Once confirmed working, disable root login
nano /etc/ssh/sshd_config

# Change these lines:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Restart SSH
systemctl restart sshd
```

### 3. Set Up SSH Key Authentication

**On your local machine:**

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@domain.com"

# Copy public key to server
ssh-copy-id root@your-vps-ip

# Test key-based login
ssh root@your-vps-ip
```

### 4. Enable Automatic Security Updates

```bash
# Install unattended-upgrades
apt install unattended-upgrades -y

# Configure automatic updates
dpkg-reconfigure -plow unattended-upgrades

# Verify configuration
cat /etc/apt/apt.conf.d/20auto-upgrades
```

### 5. Configure SSL/TLS

Coolify automatically handles SSL with Let's Encrypt, but verify:

```bash
# Check SSL certificate
curl -vI https://yourdomain.com 2>&1 | grep -i "SSL certificate"

# Test SSL configuration
# Visit: https://www.ssllabs.com/ssltest/
```

**In Coolify Dashboard:**
- ✅ Verify HTTPS redirect is enabled
- ✅ Enable HSTS (HTTP Strict Transport Security)
- ✅ Check certificate auto-renewal is active

### 6. Security Checklist

- [ ] UFW firewall enabled and configured
- [ ] Fail2Ban installed and monitoring SSH
- [ ] SSH key authentication set up
- [ ] Password authentication disabled
- [ ] Root login disabled (or restricted)
- [ ] Automatic security updates enabled
- [ ] SSL certificates active and auto-renewing
- [ ] Regular backups configured

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# Check disk space
df -h

# Check memory
free -h

# Check Docker containers
docker ps

# Check logs
docker logs ruchi-app --tail 100
```

### Weekly Maintenance

1. Review application logs
2. Check database size
3. Review backup status
4. Clean Docker:
   ```bash
   docker system prune -a --volumes
   ```

### Monthly Maintenance

1. Update system packages:
   ```bash
   apt update && apt upgrade -y
   ```
2. Review resource usage trends
3. Test backup restoration
4. Security audit

## 🔄 Data Management

### Using Built-in Import/Export

Your app has built-in import/export functionality:

1. **Export Data:**
   - Log into admin panel
   - Go to Settings → Data Management
   - Click "Export Data"
   - Download the backup file

2. **Import Data:**
   - Log into admin panel
   - Go to Settings → Data Management
   - Click "Import Data"
   - Upload your backup file

### Manual Database Backup (Optional)

If you need to create manual database backups:

```bash
# Create backup
docker exec ruchi-db pg_dump -U postgres restaurant_db > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i ruchi-db psql -U postgres restaurant_db < backup_20260105.sql
```

## 📞 Getting Help

### Check Logs First

```bash
# App logs
docker logs ruchi-app --tail 200

# Database logs
docker logs ruchi-db --tail 200

# Coolify logs
sudo journalctl -u coolify -n 200 --no-pager

# System logs
sudo journalctl -xe
```

### Useful Resources

- Coolify Docs: https://coolify.io/docs
- Coolify Discord: https://discord.gg/coolify
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

## 🎉 Deployment Complete!

Your Ruchi Restaurant app should now be:
- ✅ Running on your VPS
- ✅ Accessible via HTTPS
- ✅ Protected by firewall and intrusion prevention
- ✅ Automatically backing up the database
- ✅ Ready for production use

**Next Steps:**
1. Configure your domain DNS
2. Test all application features
3. Set up monitoring alerts
4. Create your first data export backup
5. Share your app with users!

---

**Remember**: With 2GB RAM, resource management is crucial. Monitor regularly and clean up often!
