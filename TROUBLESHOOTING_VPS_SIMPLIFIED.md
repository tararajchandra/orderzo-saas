# VPS Troubleshooting Guide (Simplified)

## 🔴 Common Issues on 2GB RAM VPS

### Issue 1: GitHub Authentication Failed (Deployment Error)

**Symptoms:**
- Deployment fails with error: `fatal: could not read Username for 'https://github.com'`
- Build logs show: `Command execution failed (exit code 128)`
- Git clone/ls-remote commands fail

**Error Message:**
```
fatal: could not read Username for 'https://github.com': No such device or address
```

**Cause:**
Coolify cannot authenticate to your private GitHub repository.

**Solutions:**

**Option A: Add GitHub Personal Access Token (Recommended)**

```bash
# 1. Create GitHub Personal Access Token
# Go to: https://github.com/settings/tokens
# Click "Generate new token (classic)"
# Select scopes: ✅ repo (full control)
# Copy the token immediately!

# 2. Add token to Coolify
# - Open Coolify dashboard
# - Go to "Sources" → "+ Add Source"
# - Select "GitHub" → "Personal Access Token"
# - Paste your token
# - Save

# 3. Update your application
# - Go to your app → "Configuration" → "Source"
# - Select the GitHub source you just created
# - Save and redeploy
```

**Option B: Use SSH Authentication**

```bash
# 1. In Coolify, go to "Sources" → "+ Add Source"
# 2. Select "GitHub" → "SSH Key"
# 3. Copy the public key shown
# 4. Add to GitHub: https://github.com/settings/keys
# 5. Update repository URL to: git@github.com:username/repo.git
```

**Option C: Make Repository Public (Quick Fix)**

```bash
# Only if no sensitive data!
# Go to: GitHub → Repository → Settings → Danger Zone
# Click "Change visibility" → "Make public"
# Redeploy in Coolify
```

**Verification:**
```bash
# After applying fix, redeploy and check logs
# You should see: "✓ Successfully cloned repository"
```

**See Also:** `DEPLOYMENT_GITHUB_AUTH_FIX.md` for detailed guide

---

### Issue 2: Out of Memory Errors

**Symptoms:**
- App crashes randomly
- "Cannot allocate memory" errors
- Docker containers stop unexpectedly

**Solutions:**

```bash
# 1. Check current memory usage
free -h
docker stats

# 2. Verify swap is active
swapon --show

# 3. If swap is not active, recreate it
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 4. Adjust swappiness (how aggressively to use swap)
sudo sysctl vm.swappiness=60
echo 'vm.swappiness=60' | sudo tee -a /etc/sysctl.conf

# 5. Clean up Docker
docker system prune -a --volumes
```

**Prevention:**
- Limit container memory in Coolify
- Don't run too many services simultaneously
- Monitor memory usage regularly

---

### Issue 3: Build Fails Due to Memory

**Symptoms:**
- Build process crashes
- "JavaScript heap out of memory" error
- Build takes forever and fails

**Solutions:**

```bash
# Option 1: Increase Node.js memory limit
# In Coolify → App → Environment Variables, add:
NODE_OPTIONS=--max-old-space-size=1024

# Option 2: Build locally and push image
# On your local machine:
docker build -t ruchi-app .
docker tag ruchi-app your-registry/ruchi-app:latest
docker push your-registry/ruchi-app:latest

# Then deploy the pre-built image in Coolify
```

**Prevention:**
- Use smaller dependencies
- Optimize build process
- Consider building on a more powerful machine

---

### Issue 4: Database Connection Timeouts

**Symptoms:**
- "Connection timeout" errors
- App can't connect to database
- Intermittent database errors

**Solutions:**

```bash
# 1. Check if database is running
docker ps | grep postgres

# 2. Check database logs
docker logs ruchi-db --tail 100

# 3. Verify connection string in Coolify
# Make sure DATABASE_URL is correct

# 4. Increase connection timeout
# In Coolify → App → Environment Variables:
DATABASE_URL=postgresql://postgres:password@ruchi-db:5432/restaurant_db?connect_timeout=30

# 5. Restart database
# In Coolify → Database → Actions → Restart
```

**Prevention:**
- Use connection pooling (Prisma handles this automatically)
- Set appropriate timeouts
- Monitor database performance

---

### Issue 5: Coolify Dashboard Not Accessible

**Symptoms:**
- Can't access http://YOUR_IP:8000
- Connection refused
- Timeout errors

**Solutions:**

```bash
# 1. Check if Coolify is running
sudo systemctl status coolify

# 2. Restart Coolify
sudo systemctl restart coolify

# 3. Check Docker
sudo systemctl status docker
sudo systemctl restart docker

# 4. Check firewall
sudo ufw status
sudo ufw allow 8000/tcp

# 5. Check logs
sudo journalctl -u coolify -n 100 --no-pager
```

---

### Issue 6: SSL Certificate Not Working

**Symptoms:**
- "Not Secure" warning in browser
- SSL certificate errors
- HTTPS not working

**Solutions:**

```bash
# 1. Verify DNS is pointing to your VPS
dig yourdomain.com
nslookup yourdomain.com

# 2. Check if ports 80 and 443 are open
sudo ufw status | grep -E '80|443'

# 3. Wait for Let's Encrypt (can take 5-10 minutes)

# 4. Force SSL renewal in Coolify
# Go to: App → Domains → Force SSL Renewal

# 5. Check Coolify logs
docker logs coolify-proxy
```

---

### Issue 7: App Deployment Fails

**Symptoms:**
- Build fails in Coolify
- Deployment stuck
- Error in build logs

**Solutions:**

```bash
# 1. Check build logs in Coolify
# Look for specific error messages

# 2. Common fixes:
# - Missing environment variables
# - Wrong Node.js version
# - Build command incorrect

# 3. Verify package.json scripts
cat package.json | grep scripts

# 4. Test build locally
npm install
npm run build

# 5. Check Coolify build settings
# Build Command: npm run build
# Start Command: npm start
# Port: 3000
```

---

### Issue 8: High CPU Usage

**Symptoms:**
- VPS becomes slow
- Apps unresponsive
- CPU at 100%

**Solutions:**

```bash
# 1. Check what's using CPU
htop
docker stats

# 2. Identify problematic container
docker stats --no-stream

# 3. Restart the container
docker restart container-name

# 4. Limit CPU usage
# In Coolify → App → Resources → CPU Limit: 1

# 5. Check for infinite loops in code
# Review application logs
```

---

### Issue 9: Disk Space Full

**Symptoms:**
- "No space left on device"
- Can't write files
- Docker fails to start

**Solutions:**

```bash
# 1. Check disk usage
df -h

# 2. Find large files
du -sh /* | sort -h

# 3. Clean Docker
docker system prune -a --volumes

# 4. Clean logs
sudo journalctl --vacuum-time=3d

# 5. Clean package cache
sudo apt clean
sudo apt autoclean
```

---

### Issue 10: Database Migration Fails

**Symptoms:**
- Migration script errors
- Tables not created
- Schema mismatch

**Solutions:**

```bash
# 1. Access app terminal in Coolify
# Go to: App → Terminal

# 2. Check database connection
npx prisma db pull

# 3. Run migration manually
npx prisma migrate deploy

# 4. If migration fails, check database
# In Coolify → Database → Terminal
psql -U postgres -d restaurant_db
\dt  # List tables
\q   # Quit

# 5. Reset database (CAUTION: deletes all data)
# In database terminal:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
# Then run migration again
```

---

### Issue 11: Environment Variables Not Working

**Symptoms:**
- App can't find configuration
- Features not working
- "undefined" errors in logs

**Solutions:**

```bash
# 1. Verify environment variables in Coolify
# Go to: App → Environment Variables

# 2. Check if variables are set correctly
# In app terminal:
printenv | grep DATABASE_URL

# 3. Restart app after adding variables
# Coolify → App → Restart

# 4. Check for typos in variable names
# DATABASE_URL vs DB_URL

# 5. Verify .env file is not committed to Git
# Check .gitignore includes .env
```

---

### Issue 12: Import/Export Not Working

**Symptoms:**
- Can't export data from admin panel
- Import fails with errors
- File upload issues

**Solutions:**

```bash
# 1. Check file upload limits
# In Coolify → App → Environment Variables, add:
BODY_SIZE_LIMIT=50mb

# 2. Check disk space
df -h

# 3. Verify file permissions
# In app terminal:
ls -la /app/uploads

# 4. Check application logs
docker logs ruchi-app --tail 100

# 5. Test with smaller file
# Try exporting/importing a subset of data
```

---

## 🔧 Monitoring Commands

### Check System Health

```bash
# Overall system status
htop

# Memory usage
free -h

# Disk usage
df -h

# CPU usage
top

# All Docker containers
docker ps -a

# Container resource usage
docker stats

# System logs
sudo journalctl -xe
```

### Check Specific Services

```bash
# Coolify
sudo systemctl status coolify
docker logs coolify-proxy

# Your app
docker logs ruchi-app --tail 100

# Database
docker logs ruchi-db --tail 100
```

### Performance Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor CPU and memory
htop

# Monitor disk I/O
sudo iotop

# Monitor network
sudo nethogs

# Check load average
uptime
```

---

## 🚨 Emergency Procedures

### If VPS Becomes Unresponsive

1. **Reboot via VPS provider's control panel**
2. **After reboot, check services:**
   ```bash
   sudo systemctl status docker
   sudo systemctl status coolify
   docker ps -a
   ```
3. **Restart failed containers:**
   ```bash
   docker start container-name
   ```

### If Database is Corrupted

1. **Stop the app**
2. **Restore from Coolify backup:**
   ```bash
   # In Coolify → Database → Backups → Restore
   ```
3. **Or restore from manual backup:**
   ```bash
   docker exec -i ruchi-db psql -U postgres restaurant_db < backup.sql
   ```

### If Coolify is Broken

1. **Reinstall Coolify:**
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```
2. **Restore from backup** (if you have one)

---

## 📊 Performance Optimization Tips

### For 2GB RAM VPS

1. **Limit concurrent builds** - Only build one app at a time
2. **Use swap** - Essential for 2GB RAM
3. **Clean regularly** - Run `docker system prune` weekly
4. **Monitor resources** - Set up alerts
5. **Optimize images** - Use smaller base images
6. **Limit logs** - Configure log rotation
7. **Use caching** - Enable build caching in Coolify

### Database Optimization

```sql
-- In database terminal
-- Analyze tables
ANALYZE;

-- Vacuum database
VACUUM;

-- Check database size
SELECT pg_size_pretty(pg_database_size('restaurant_db'));
```

### Application Optimization

```bash
# 1. Enable production mode
# Verify NODE_ENV=production in environment variables

# 2. Use CDN for static assets (if applicable)

# 3. Enable compression
# Coolify handles this automatically with nginx

# 4. Monitor slow queries
# Check application logs for database performance
```

---

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

## ✅ Preventive Maintenance Checklist

### Daily
- [ ] Check if all services are running: `docker ps`
- [ ] Monitor disk space: `df -h`
- [ ] Check memory usage: `free -h`

### Weekly
- [ ] Clean Docker: `docker system prune`
- [ ] Review logs for errors
- [ ] Check backup status
- [ ] Update packages: `apt update && apt upgrade`
- [ ] Export data using admin panel (as backup)

### Monthly
- [ ] Review resource usage trends
- [ ] Test backup restoration
- [ ] Update Docker images
- [ ] Security audit
- [ ] Test import/export functionality

---

## 💾 Data Backup Strategy

Since your app has built-in import/export functionality, use this for regular backups:

### Automated Backup Script (Optional)

```bash
# Create backup script using your app's export API
cat > /root/backup-app-data.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/ruchi-app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Use your app's export API endpoint
# Replace with your actual admin credentials and endpoint
curl -X POST https://yourdomain.com/api/admin/export \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o $BACKUP_DIR/export_$DATE.json

# Keep only last 14 days
find $BACKUP_DIR -name "export_*.json" -mtime +14 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup-app-data.sh

# Add to crontab (runs daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-app-data.sh") | crontab -
```

### Manual Backup Process

1. **Log into admin panel**
2. **Go to Settings → Data Management**
3. **Click "Export Data"**
4. **Download and save the file securely**
5. **Store backups in multiple locations**

---

**Remember**: With 2GB RAM, resource management is crucial. Monitor regularly and clean up often!
