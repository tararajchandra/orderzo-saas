# 🚀 VPS Deployment Checklist

Print this page and check off items as you complete them!

---

## 📋 Pre-Deployment Preparation

### Local Setup
- [ ] Code is working locally without errors
- [ ] All features tested and working
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] Git repository created
- [ ] Code pushed to GitHub

### Domain & DNS
- [ ] Domain name purchased
- [ ] Access to domain DNS settings
- [ ] Know your VPS IP address

### Accounts & Credentials
- [ ] VPS access credentials ready
- [ ] GitHub account ready
- [ ] Google OAuth credentials (if using)
- [ ] Email for admin account chosen

---

## 🖥️ VPS Initial Setup

### System Setup
- [ ] Connected to VPS via SSH
- [ ] System updated (`apt update && apt upgrade`)
- [ ] 2GB swap file created and activated
- [ ] Swap verified with `free -h`
- [ ] Firewall (UFW) installed
- [ ] Required ports opened (22, 80, 443, 25, 587, 465, 993, 143)
- [ ] Firewall enabled

### Verification Commands
```bash
free -h          # Should show 2GB swap
ufw status       # Should show active with ports
df -h            # Check disk space
```

---

## 🐳 Coolify Installation

### Installation
- [ ] Coolify installation script downloaded
- [ ] Coolify installed successfully
- [ ] Docker installed (automatic with Coolify)
- [ ] Coolify accessible at `http://VPS_IP:8000`

### Coolify Setup
- [ ] Admin account created
- [ ] Email configured
- [ ] Password saved securely
- [ ] Dashboard accessible

### Credentials to Save
```
Coolify URL: http://___________________:8000
Email: _____________________________________
Password: __________________________________
```

---

## 📧 Stalwart Mail Server

### Installation
- [ ] Directory created (`/opt/stalwart`)
- [ ] `docker-compose.yml` created
- [ ] Domain name updated in compose file
- [ ] Stalwart started (`docker-compose up -d`)
- [ ] Stalwart accessible at `http://VPS_IP:8080`

### Configuration
- [ ] Logged into admin panel
- [ ] Default password changed
- [ ] Email accounts created:
  - [ ] noreply@yourdomain.com
  - [ ] admin@yourdomain.com
  - [ ] support@yourdomain.com

### Credentials to Save
```
Stalwart URL: http://___________________:8080
Username: admin
Password: __________________________________
```

---

## 🌐 DNS Configuration

### A Records
- [ ] `@` → VPS_IP
- [ ] `mail` → VPS_IP
- [ ] `app` → VPS_IP (if using subdomain)

### MX Record
- [ ] `@` MX 10 → `mail.yourdomain.com`

### TXT Records
- [ ] SPF: `v=spf1 mx ~all`
- [ ] DMARC: `v=DMARC1; p=none`

### Verification
- [ ] DNS propagation checked (wait 15 minutes)
- [ ] `dig yourdomain.com` shows correct IP
- [ ] `dig MX yourdomain.com` shows mail server

---

## 🗄️ Database Setup in Coolify

### PostgreSQL Database
- [ ] Database created in Coolify
- [ ] Name: `ruchi-db`
- [ ] Database name: `restaurant_db`
- [ ] Username: `postgres`
- [ ] Password generated/set
- [ ] Database status: Running

### Credentials to Save
```
DB Host: ruchi-db
DB Name: restaurant_db
DB User: postgres
DB Password: _______________________________
```

---

## 📦 Application Deployment

### GitHub Repository
- [ ] Code pushed to GitHub
- [ ] Repository URL copied
- [ ] Branch: `main`
- [ ] `.gitignore` includes `.env`

### Coolify App Setup
- [ ] New application created
- [ ] Repository connected
- [ ] Build pack: `nixpacks`
- [ ] Port: `3000`
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`

### Environment Variables Set
- [ ] `DB_HOST=ruchi-db`
- [ ] `DB_PORT=5432`
- [ ] `DB_NAME=restaurant_db`
- [ ] `DB_USER=postgres`
- [ ] `DB_PASSWORD=...`
- [ ] `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `JWT_SECRET=...` (64+ characters)
- [ ] `GOOGLE_CLIENT_ID=...` (if using)
- [ ] `GOOGLE_CLIENT_SECRET=...` (if using)
- [ ] `SMTP_HOST=mail.yourdomain.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_USER=noreply@yourdomain.com`
- [ ] `SMTP_PASSWORD=...`
- [ ] `SMTP_FROM=noreply@yourdomain.com`

### Domain Configuration
- [ ] Domain added in Coolify
- [ ] Auto SSL enabled
- [ ] HTTPS redirect enabled

### Deployment
- [ ] First deployment triggered
- [ ] Build logs monitored
- [ ] Build completed successfully
- [ ] App status: Running

---

## 🔧 Post-Deployment Setup

### Database Initialization
- [ ] Accessed app terminal in Coolify
- [ ] Ran `npm run migrate`
- [ ] Migration completed successfully
- [ ] Ran `npm run create-admin`
- [ ] Admin user created

### Admin Credentials
```
Admin Email: _______________________________
Admin Password: ____________________________
```

---

## ✅ Testing & Verification

### Basic Functionality
- [ ] App accessible at `https://yourdomain.com`
- [ ] SSL certificate active (green padlock)
- [ ] Homepage loads correctly
- [ ] No console errors

### Authentication
- [ ] Admin login works
- [ ] Customer signup works
- [ ] Email verification works (if enabled)
- [ ] Google OAuth works (if enabled)
- [ ] Logout works

### Core Features
- [ ] Menu page loads
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Checkout process works
- [ ] Order creation works
- [ ] Admin panel accessible
- [ ] Admin dashboard loads

### Email Testing
- [ ] Signup email received
- [ ] Order confirmation email received
- [ ] Email formatting correct

### Performance
- [ ] Page load time < 3 seconds
- [ ] No memory errors
- [ ] No database connection errors

---

## 🔐 Security Hardening

### System Security
- [ ] Root SSH login disabled
- [ ] Password authentication disabled (use SSH keys)
- [ ] Fail2Ban installed
- [ ] Automatic security updates enabled

### Application Security
- [ ] Strong JWT secret set
- [ ] Strong admin password set
- [ ] Environment variables not exposed
- [ ] HTTPS enforced
- [ ] CORS configured properly

---

## 📊 Monitoring & Backups

### Monitoring Setup
- [ ] Coolify monitoring enabled
- [ ] Resource alerts configured
- [ ] Email notifications set up

### Backup Configuration
- [ ] Database backups enabled in Coolify
- [ ] Backup frequency: Daily
- [ ] Backup retention: 7 days
- [ ] Backup location verified
- [ ] Test restore performed

### Manual Backup Script
- [ ] Backup script created (`/root/backup-app.sh`)
- [ ] Script made executable
- [ ] Cron job added (daily 2 AM)
- [ ] First backup tested

---

## 🎯 Optional Enhancements

### Performance
- [ ] CDN configured (Cloudflare)
- [ ] Image optimization enabled
- [ ] Caching configured
- [ ] Compression enabled

### Features
- [ ] Analytics added (Google Analytics)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Status page created

### Documentation
- [ ] User guide created
- [ ] Admin guide created
- [ ] API documentation (if applicable)

---

## 📝 Final Checklist

### Documentation
- [ ] All credentials saved securely
- [ ] Deployment notes documented
- [ ] Known issues documented
- [ ] Maintenance schedule created

### Handoff (if applicable)
- [ ] Client trained on admin panel
- [ ] Credentials shared securely
- [ ] Support plan established
- [ ] Maintenance agreement signed

### Go Live
- [ ] All tests passed
- [ ] Stakeholders notified
- [ ] Social media updated
- [ ] Google Search Console submitted
- [ ] Analytics tracking verified

---

## 🎉 Deployment Complete!

### Post-Launch Tasks (First Week)

**Day 1:**
- [ ] Monitor error logs
- [ ] Check resource usage
- [ ] Verify backups running
- [ ] Test all critical features

**Day 3:**
- [ ] Review analytics
- [ ] Check email deliverability
- [ ] Monitor performance
- [ ] Gather user feedback

**Day 7:**
- [ ] Performance review
- [ ] Security audit
- [ ] Backup verification
- [ ] Plan improvements

---

## 📞 Emergency Contacts

```
VPS Provider Support: _______________________
Domain Registrar: ___________________________
Your Email: _________________________________
Client Email: _______________________________
```

---

## 🔗 Important URLs

```
Production App: https://________________________
Coolify Dashboard: http://______________________:8000
Stalwart Mail: http://______________________:8080
GitHub Repo: https://github.com/_________________
```

---

## ⏱️ Deployment Timeline

- Started: ___/___/______ at _____:_____
- Completed: ___/___/______ at _____:_____
- Total Time: _______ hours

---

**Congratulations on your successful deployment! 🎊**

Keep this checklist for future reference and maintenance tasks.
