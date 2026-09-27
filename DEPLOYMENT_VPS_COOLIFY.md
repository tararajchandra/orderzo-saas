# VPS Deployment Guide: Coolify + Stalwart Mail Server

This guide will help you deploy your Ruchi Restaurant app on a VPS (2 Core CPU, 2GB RAM) using Coolify and set up Stalwart Mail Server.

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

### Step 4: Set Up Security (UFW + Fail2Ban)

**IMPORTANT:** You need BOTH UFW (firewall) and Fail2Ban (intrusion prevention) for complete security.

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

# Allow email ports (for Stalwart)
ufw allow 25/tcp    # SMTP
ufw allow 587/tcp   # SMTP Submission
ufw allow 465/tcp   # SMTPS
ufw allow 993/tcp   # IMAPS
ufw allow 143/tcp   # IMAP

# Allow Coolify dashboard (if accessing remotely)
ufw allow 8000/tcp

# Allow Stalwart admin (if accessing remotely)
ufw allow 8080/tcp

# Enable firewall
ufw enable

# Verify status
ufw status verbose
```

**Expected output:**
```
Status: active
To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
...
```

#### 4.2: Install and Configure Fail2Ban

Fail2Ban protects against brute force attacks by banning IPs after failed login attempts.

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

# Email notifications (optional)
# destemail = your-email@domain.com
# sendername = Fail2Ban
# action = %(action_mwl)s

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
|- Number of jail:      4
`- Jail list:   nginx-badbots, nginx-botsearch, nginx-http-auth, sshd
```

#### 4.3: Verify Security Setup

```bash
# Check UFW status
ufw status numbered

# Check Fail2Ban status
fail2ban-client status

# Check SSH jail
fail2ban-client status sshd

# View banned IPs (if any)
fail2ban-client get sshd banned

# Test firewall
nmap localhost
```

#### 4.4: Monitor Security

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

#### 4.5: Useful Fail2Ban Commands

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
- ✅ Fail2Ban bans IPs after 5 failed SSH attempts for 1 hour
- ✅ Both work together for comprehensive protection
- ⚠️ Always allow SSH (port 22) BEFORE enabling UFW
- ⚠️ Save your IP before enabling strict rules

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

2. **Configure email notifications** (optional):
   - Settings → Email
   - You can configure this later after setting up Stalwart

## 📧 Part 3: Install Stalwart Mail Server

### Step 1: Install Stalwart via Docker

```bash
# Create directory for Stalwart
mkdir -p /opt/stalwart
cd /opt/stalwart

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  stalwart:
    image: stalwartlabs/mail-server:latest
    container_name: stalwart-mail
    hostname: mail.yourdomain.com  # Replace with your domain
    ports:
      - "25:25"     # SMTP
      - "587:587"   # Submission
      - "465:465"   # SMTPS
      - "143:143"   # IMAP
      - "993:993"   # IMAPS
      - "4190:4190" # ManageSieve
      - "8080:8080" # Web Admin
    volumes:
      - ./data:/opt/stalwart-mail
    environment:
      - STALWART_DOMAIN=yourdomain.com  # Replace with your domain
    restart: unless-stopped
EOF
```

### Step 2: Configure DNS Records

Before starting Stalwart, configure these DNS records:

```
# A Records
mail.yourdomain.com     A       your-vps-ip
yourdomain.com          A       your-vps-ip

# MX Record
yourdomain.com          MX 10   mail.yourdomain.com

# SPF Record
yourdomain.com          TXT     "v=spf1 mx ~all"

# DMARC Record
_dmarc.yourdomain.com   TXT     "v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com"
```

### Step 3: Start Stalwart

```bash
cd /opt/stalwart
docker-compose up -d
```

### Step 4: Access Stalwart Admin Panel

1. Go to: `http://your-vps-ip:8080`
2. Default credentials:
   - Username: `admin`
   - Password: `changeme`
3. **Change the password immediately!**

### Step 5: Create Email Accounts

In Stalwart admin panel:
1. Go to "Accounts"
2. Create email accounts:
   - `noreply@yourdomain.com` (for app notifications)
   - `admin@yourdomain.com` (for admin emails)
   - `support@yourdomain.com` (for customer support)

## 🎯 Part 4: Deploy Ruchi App with Coolify

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
   DB_HOST=ruchi-db  # Use the database service name from Coolify
   DB_PORT=5432
   DB_NAME=restaurant_db
   DB_USER=postgres
   DB_PASSWORD=your-db-password-from-coolify
   
   # Application
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NODE_ENV=production
   PORT=3000
   
   # JWT Secret (generate a strong random string)
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   
   # Google OAuth (if using)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Email Configuration (Stalwart)
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=587
   SMTP_USER=noreply@yourdomain.com
   SMTP_PASSWORD=your-email-password
   SMTP_FROM=noreply@yourdomain.com
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
   npm run migrate
   ```

3. Create admin user:
   ```bash
   npm run create-admin
   ```

### Step 5: Test Your Deployment

1. Visit your domain: `https://yourdomain.com`
2. Try logging in with admin credentials
3. Test all features

## 🔧 Part 5: Post-Deployment Configuration

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

### Configure Backups

#### Database Backups

1. In Coolify, go to your database → **"Backups"**
2. Configure:
   - Frequency: Daily
   - Retention: 7 days
   - Time: 2:00 AM (low traffic time)

#### Application Backups

```bash
# Create backup script
cat > /root/backup-app.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/ruchi-app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec ruchi-db pg_dump -U postgres restaurant_db > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files (if any)
# tar -czf $BACKUP_DIR/files_$DATE.tar.gz /path/to/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup-app.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-app.sh") | crontab -
```

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

**Note:** UFW and Fail2Ban were already configured in Part 1, Step 4. This section covers additional security hardening.

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

### 4. Change Default SSH Port (Optional but Recommended)

```bash
# Edit SSH config
nano /etc/ssh/sshd_config

# Change port (e.g., to 2222)
Port 2222

# Restart SSH
systemctl restart sshd

# Update UFW
ufw allow 2222/tcp
ufw delete allow 22/tcp

# Update Fail2Ban
nano /etc/fail2ban/jail.local
# Change: port = 2222

systemctl restart fail2ban

# Test new port before closing current session
# ssh -p 2222 root@your-vps-ip
```

### 5. Enable Automatic Security Updates

```bash
# Install unattended-upgrades
apt install unattended-upgrades -y

# Configure automatic updates
dpkg-reconfigure -plow unattended-upgrades

# Verify configuration
cat /etc/apt/apt.conf.d/20auto-upgrades
```

### 6. Set Up Email Alerts for Fail2Ban

```bash
# Edit Fail2Ban configuration
nano /etc/fail2ban/jail.local

# Add under [DEFAULT]:
destemail = admin@yourdomain.com
sendername = Fail2Ban-VPS
action = %(action_mwl)s

# Restart Fail2Ban
systemctl restart fail2ban
```

### 7. Configure SSL/TLS

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

### 8. Implement Rate Limiting

**For Nginx (via Coolify):**

Create custom Nginx configuration in Coolify:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

# Apply to locations
location / {
    limit_req zone=general burst=20 nodelay;
}

location /api/ {
    limit_req zone=api burst=50 nodelay;
}
```

### 9. Monitor Failed Login Attempts

```bash
# Create monitoring script
cat > /root/security-check.sh << 'EOF'
#!/bin/bash
echo "=== Failed SSH Attempts (Last 24 hours) ==="
grep "Failed password" /var/log/auth.log | grep "$(date +%b\ %d)" | wc -l

echo ""
echo "=== Currently Banned IPs ==="
fail2ban-client banned

echo ""
echo "=== Top 10 Failed Login IPs ==="
grep "Failed password" /var/log/auth.log | awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10

echo ""
echo "=== UFW Status ==="
ufw status numbered
EOF

chmod +x /root/security-check.sh

# Run daily via cron
(crontab -l 2>/dev/null; echo "0 8 * * * /root/security-check.sh | mail -s 'Daily Security Report' admin@yourdomain.com") | crontab -
```

### 10. Harden System Configuration

```bash
# Disable unnecessary services
systemctl disable bluetooth
systemctl disable cups

# Set secure file permissions
chmod 700 /root
chmod 600 /etc/ssh/sshd_config

# Disable IPv6 (if not needed)
echo "net.ipv6.conf.all.disable_ipv6 = 1" >> /etc/sysctl.conf
sysctl -p

# Enable SYN cookies (DDoS protection)
echo "net.ipv4.tcp_syncookies = 1" >> /etc/sysctl.conf
sysctl -p
```

### 11. Install and Configure ModSecurity (Advanced)

```bash
# Install ModSecurity
apt install libapache2-mod-security2 -y

# Enable OWASP Core Rule Set
cd /etc/modsecurity
mv modsecurity.conf-recommended modsecurity.conf

# Edit configuration
nano modsecurity.conf
# Change: SecRuleEngine DetectionOnly -> SecRuleEngine On

# Restart web server
systemctl restart nginx
```

### 12. Security Checklist

- [ ] UFW firewall enabled and configured
- [ ] Fail2Ban installed and monitoring SSH
- [ ] SSH key authentication set up
- [ ] Password authentication disabled
- [ ] Root login disabled (or restricted)
- [ ] SSH port changed (optional)
- [ ] Automatic security updates enabled
- [ ] SSL certificates active and auto-renewing
- [ ] Rate limiting configured
- [ ] Security monitoring in place
- [ ] Regular backups configured
- [ ] Fail2Ban email alerts set up

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
4. Update Docker images if needed

### Monthly Tasks

1. Review security updates
2. Analyze resource usage trends
3. Clean up old Docker images:
   ```bash
   docker system prune -a
   ```

## 🆘 Troubleshooting

### App Won't Start

```bash
# Check logs
docker logs ruchi-app

# Check if database is running
docker ps | grep postgres

# Restart app
# In Coolify: Go to app → Actions → Restart
```

### Database Connection Issues

```bash
# Test database connection
docker exec -it ruchi-db psql -U postgres -d restaurant_db

# Check environment variables
# In Coolify: App → Environment Variables
```

### Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Restart services
systemctl restart docker
```

### Email Not Sending

```bash
# Check Stalwart logs
docker logs stalwart-mail

# Test SMTP connection
telnet mail.yourdomain.com 587
```

## 📈 Scaling Considerations

When your app grows and 2GB RAM becomes insufficient:

1. **Upgrade VPS** to 4GB RAM
2. **Separate services**:
   - Database on separate server
   - Mail server on separate server
3. **Use CDN** for static assets
4. **Enable caching** (Redis)

## 🎉 Deployment Checklist

- [ ] VPS set up with swap space
- [ ] Firewall configured
- [ ] Coolify installed and accessible
- [ ] Stalwart Mail Server installed
- [ ] DNS records configured
- [ ] PostgreSQL database created
- [ ] App deployed successfully
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Admin user created
- [ ] SSL certificate active
- [ ] Email sending works
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Security hardened

## 📞 Need Help?

- Coolify Docs: https://coolify.io/docs
- Stalwart Docs: https://stalw.art/docs
- Next.js Deployment: https://nextjs.org/docs/deployment

## 🔗 Useful Commands

```bash
# Coolify
systemctl status coolify
systemctl restart coolify

# View all containers
docker ps -a

# View logs
docker logs -f container-name

# Access container shell
docker exec -it container-name /bin/bash

# Check resource usage
htop
docker stats
```

---

**Estimated Total Setup Time**: 2-3 hours
**Difficulty**: Intermediate

Good luck with your deployment! 🚀
