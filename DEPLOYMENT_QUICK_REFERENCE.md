# 🎯 VPS Deployment Quick Reference Card

**Keep this open during deployment!**

---

## 📞 Essential Information

### Your VPS Details
```
IP Address: _______________________
SSH User: root
SSH Port: 22
OS: Ubuntu 22.04/24.04
```

### Your Domain
```
Domain: ___________________________
DNS Provider: _____________________
```

---

## ⚡ Quick Commands

### Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

### Check System Status
```bash
free -h              # Memory (should show 2GB swap)
df -h                # Disk space
docker ps            # Running containers
htop                 # Overall system monitor
```

### Service Status
```bash
systemctl status coolify
systemctl status docker
docker logs coolify-proxy
docker logs ruchi-app
docker logs ruchi-db
docker logs stalwart-mail
```

### Restart Services
```bash
systemctl restart coolify
systemctl restart docker
docker restart ruchi-app
docker restart ruchi-db
cd /opt/stalwart && docker-compose restart
```

### Clean Up (if low on space)
```bash
docker system prune -a
apt clean
journalctl --vacuum-time=3d
```

---

## 🔑 Important URLs

```
Coolify Dashboard: http://YOUR_VPS_IP:8000
Stalwart Admin: http://YOUR_VPS_IP:8080
Your App: https://yourdomain.com
Health Check: https://yourdomain.com/api/health
```

---

## 📋 Deployment Steps (Quick)

### 1. VPS Setup (30 min)
```bash
# Update system
apt update && apt upgrade -y

# Create swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Firewall
apt install ufw -y
ufw allow 22,80,443,25,587,465,993,143/tcp
ufw enable
```

### 2. Install Coolify (10 min)
```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
# Access: http://YOUR_VPS_IP:8000
```

### 3. Install Stalwart (20 min)
```bash
mkdir -p /opt/stalwart && cd /opt/stalwart
# Create docker-compose.yml (see full guide)
docker-compose up -d
# Access: http://YOUR_VPS_IP:8080
```

### 4. DNS Setup (15 min)
```
A     @        YOUR_VPS_IP
A     mail     YOUR_VPS_IP
MX    @        mail.yourdomain.com
TXT   @        v=spf1 mx ~all
```

### 5. Deploy App (45 min)
- Create PostgreSQL in Coolify
- Push code to GitHub
- Create app in Coolify
- Set environment variables
- Add domain
- Deploy
- Run migrations

---

## 🚨 Common Issues & Fixes

### Out of Memory
```bash
free -h                    # Check swap
swapon /swapfile          # Enable swap
docker system prune -a    # Clean Docker
```

### Can't Access Coolify
```bash
systemctl restart coolify
systemctl restart docker
ufw allow 8000/tcp
```

### SSL Not Working
```bash
# Wait 5-10 minutes for Let's Encrypt
# Check DNS: dig yourdomain.com
# Verify ports: ufw status | grep -E '80|443'
```

### Database Connection Failed
```bash
# Check DB is running
docker ps | grep postgres
# Verify DB_HOST=ruchi-db in env vars
# Check logs: docker logs ruchi-db
```

### App Won't Build
```bash
# Check logs in Coolify
# Verify environment variables
# Check Node.js version in package.json
```

---

## 📊 Environment Variables Template

```env
# Database
DB_HOST=ruchi-db
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=<FROM_COOLIFY>

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
PORT=3000
JWT_SECRET=<RANDOM_64_CHARS>

# Google OAuth (optional)
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>

# Email
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=<FROM_STALWART>
SMTP_FROM=noreply@yourdomain.com
```

---

## ✅ Verification Checklist

After deployment:
- [ ] App loads at https://yourdomain.com
- [ ] SSL certificate active (green padlock)
- [ ] Admin login works
- [ ] Database connected (no errors)
- [ ] Email sending works
- [ ] All pages load correctly
- [ ] Swap is active: `free -h`
- [ ] Backups configured
- [ ] Monitoring enabled

---

## 🔧 Maintenance Commands

### Daily
```bash
docker ps                  # Check all running
free -h                    # Check memory
df -h                      # Check disk
```

### Weekly
```bash
docker system prune -a     # Clean Docker
apt update && apt upgrade  # Update system
```

### Monthly
```bash
# Review logs
docker logs ruchi-app --tail 500
# Test backups
# Update Docker images
```

---

## 📞 Emergency Procedures

### VPS Unresponsive
1. Reboot via VPS provider panel
2. After reboot: `docker ps -a`
3. Restart stopped containers

### Database Corrupted
```bash
# Backup first
docker exec ruchi-db pg_dump -U postgres restaurant_db > backup.sql
# Restore
docker exec -i ruchi-db psql -U postgres restaurant_db < backup.sql
```

### Coolify Broken
```bash
# Reinstall
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

---

## 📚 Full Documentation

- **Start Here**: DEPLOYMENT_README.md
- **Quick Guide**: DEPLOYMENT_QUICKSTART.md
- **Detailed**: DEPLOYMENT_VPS_COOLIFY.md
- **Checklist**: DEPLOYMENT_CHECKLIST.md
- **Troubleshooting**: TROUBLESHOOTING_VPS.md

---

## 💡 Pro Tips

1. **Always create swap** on 2GB RAM VPS
2. **Monitor resources** regularly
3. **Set up backups** immediately
4. **Test before deploying** to production
5. **Document everything** you change
6. **Keep credentials** in a password manager
7. **Update regularly** but test first
8. **Monitor logs** for early warning signs

---

## 🎯 Resource Limits (2GB RAM)

```
Recommended Limits:
- App: 512MB RAM, 1 CPU
- Database: 512MB RAM, 1 CPU
- Stalwart: 256MB RAM, 0.5 CPU
- Coolify: 256MB RAM, 0.5 CPU
- System: 512MB RAM reserved
```

---

**Print this card and keep it handy during deployment!**

*Last Updated: January 2026*
