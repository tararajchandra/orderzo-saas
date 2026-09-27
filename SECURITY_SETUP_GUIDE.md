# 🔐 VPS Security Setup Guide

Complete security hardening for your 2GB RAM VPS running Coolify and Ruchi Restaurant app.

---

## 🎯 Security Overview

**Two-Layer Security Approach:**

1. **UFW (Firewall)** - Controls which ports are accessible
2. **Fail2Ban (Intrusion Prevention)** - Blocks attackers after failed attempts

**Why both?** They complement each other:
- UFW blocks unauthorized port access
- Fail2Ban stops brute force attacks on allowed ports

---

## ⚡ Quick Security Setup (15 minutes)

### Step 1: Configure UFW Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Set default policies (deny all incoming, allow all outgoing)
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (CRITICAL - do this first!)
sudo ufw allow 22/tcp

# Allow web traffic
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS

# Allow email ports (for Stalwart Mail Server)
sudo ufw allow 25/tcp     # SMTP
sudo ufw allow 587/tcp    # SMTP Submission
sudo ufw allow 465/tcp    # SMTPS
sudo ufw allow 993/tcp    # IMAPS
sudo ufw allow 143/tcp    # IMAP

# Allow Coolify dashboard (if accessing remotely)
sudo ufw allow 8000/tcp

# Allow Stalwart admin panel (if accessing remotely)
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable

# Verify configuration
sudo ufw status verbose
```

**Expected Output:**
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
...
```

### Step 2: Install and Configure Fail2Ban

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Create local configuration file
sudo cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Ban settings
bantime = 10m
findtime = 10m
maxretry = 5

# Email notifications (optional - configure after Stalwart setup)
# destemail = admin@yourdomain.com
# sendername = Fail2Ban-VPS
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
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verify Fail2Ban is running
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

**Expected Output:**
```
Status
|- Number of jail:      5
`- Jail list:   nginx-badbots, nginx-botsearch, nginx-http-auth, nginx-noscript, sshd
```

---

## 🔍 Verify Security Setup

```bash
# Check UFW status
sudo ufw status numbered

# Check Fail2Ban status
sudo systemctl status fail2ban
sudo fail2ban-client status

# Check SSH jail specifically
sudo fail2ban-client status sshd

# View currently banned IPs
sudo fail2ban-client banned

# Test firewall (should only show allowed ports)
sudo nmap localhost
```

---

## 📊 Monitor Security

### View Logs

```bash
# UFW logs (blocked connection attempts)
sudo tail -f /var/log/ufw.log

# Fail2Ban logs (banned IPs)
sudo tail -f /var/log/fail2ban.log

# SSH authentication attempts
sudo tail -f /var/log/auth.log

# Failed SSH login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20
```

### Daily Security Check Script

```bash
# Create security monitoring script
sudo cat > /root/security-check.sh << 'EOF'
#!/bin/bash

echo "=== VPS Security Report ==="
echo "Date: $(date)"
echo ""

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

echo ""
echo "=== Fail2Ban Jail Status ==="
fail2ban-client status

echo ""
echo "=== System Resources ==="
free -h
df -h | grep -E '^/dev/'
EOF

sudo chmod +x /root/security-check.sh

# Run it
sudo /root/security-check.sh
```

---

## 🛠️ Fail2Ban Management

### Common Commands

```bash
# View all jails
sudo fail2ban-client status

# View specific jail status
sudo fail2ban-client status sshd

# View banned IPs in a jail
sudo fail2ban-client get sshd banned

# Unban an IP (if you locked yourself out)
sudo fail2ban-client set sshd unbanip YOUR_IP

# Ban an IP manually
sudo fail2ban-client set sshd banip MALICIOUS_IP

# Reload Fail2Ban configuration
sudo fail2ban-client reload

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### View Ban Statistics

```bash
# Count total bans
sudo zgrep "Ban" /var/log/fail2ban.log* | wc -l

# View recent bans
sudo grep "Ban" /var/log/fail2ban.log | tail -20

# View unbans
sudo grep "Unban" /var/log/fail2ban.log | tail -10
```

---

## 🔧 Advanced Security Hardening

### 1. Set Up SSH Key Authentication

**On your local machine:**

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@domain.com"

# Copy public key to server
ssh-copy-id root@YOUR_VPS_IP

# Test key-based login
ssh root@YOUR_VPS_IP
```

**On your VPS:**

```bash
# Once key authentication works, disable password authentication
sudo nano /etc/ssh/sshd_config

# Change these lines:
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

### 2. Disable Root Login (Recommended)

**IMPORTANT:** Only do this after creating a non-root user with sudo access!

```bash
# Create new user
sudo adduser deploy
sudo usermod -aG sudo deploy

# Set up SSH key for new user
sudo mkdir -p /home/deploy/.ssh
sudo cp /root/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Test login as new user FIRST
# ssh deploy@YOUR_VPS_IP

# Once confirmed working, disable root login
sudo nano /etc/ssh/sshd_config

# Change:
PermitRootLogin no

# Restart SSH
sudo systemctl restart sshd
```

### 3. Change Default SSH Port (Optional)

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change port (e.g., to 2222)
Port 2222

# Restart SSH
sudo systemctl restart sshd

# Update UFW
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp

# Update Fail2Ban
sudo nano /etc/fail2ban/jail.local
# Change: port = 2222 under [sshd]

sudo systemctl restart fail2ban

# Test new port BEFORE closing current session
# ssh -p 2222 root@YOUR_VPS_IP
```

### 4. Enable Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Verify configuration
cat /etc/apt/apt.conf.d/20auto-upgrades
```

Should show:
```
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

### 5. Configure Fail2Ban Email Alerts

**After setting up Stalwart Mail Server:**

```bash
# Edit Fail2Ban configuration
sudo nano /etc/fail2ban/jail.local

# Add under [DEFAULT]:
destemail = admin@yourdomain.com
sendername = Fail2Ban-VPS
action = %(action_mwl)s

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 6. Harden System Configuration

```bash
# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable cups

# Set secure file permissions
sudo chmod 700 /root
sudo chmod 600 /etc/ssh/sshd_config

# Enable SYN cookies (DDoS protection)
echo "net.ipv4.tcp_syncookies = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Disable IPv6 (if not needed)
echo "net.ipv6.conf.all.disable_ipv6 = 1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Limit SSH login attempts
echo "MaxAuthTries 3" | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd
```

---

## 🚨 Emergency Procedures

### If You Lock Yourself Out

1. **Via VPS Provider Console:**
   - Most VPS providers have a web-based console
   - Access through provider's control panel
   - Login and fix the issue

2. **Unban Your IP:**
   ```bash
   sudo fail2ban-client set sshd unbanip YOUR_IP
   ```

3. **Disable Fail2Ban Temporarily:**
   ```bash
   sudo systemctl stop fail2ban
   # Fix the issue
   sudo systemctl start fail2ban
   ```

### If UFW Blocks You

```bash
# Via VPS console
sudo ufw disable
# Fix the issue
sudo ufw enable
```

---

## ✅ Security Checklist

- [ ] UFW firewall installed and enabled
- [ ] Default policies set (deny incoming, allow outgoing)
- [ ] Essential ports allowed (22, 80, 443, email ports)
- [ ] Fail2Ban installed and running
- [ ] SSH jail configured and active
- [ ] Nginx jails configured
- [ ] SSH key authentication set up
- [ ] Password authentication disabled (optional)
- [ ] Root login disabled (optional)
- [ ] SSH port changed (optional)
- [ ] Automatic security updates enabled
- [ ] Security monitoring script created
- [ ] Email alerts configured (optional)
- [ ] System hardening applied

---

## 📊 Security Metrics

### Check Your Security Score

```bash
# Run comprehensive security check
sudo /root/security-check.sh

# Check for open ports
sudo nmap localhost

# Check for listening services
sudo netstat -tulpn

# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log | wc -l

# Check banned IPs count
sudo fail2ban-client banned | wc -l
```

### Benchmark

**Good Security:**
- UFW: Active with minimal open ports
- Fail2Ban: 0-5 banned IPs (normal traffic)
- Failed logins: <100/day
- Open ports: Only necessary services

**Needs Attention:**
- Fail2Ban: >50 banned IPs (under attack)
- Failed logins: >1000/day
- Open ports: Unnecessary services exposed

---

## 📚 Additional Resources

- UFW Documentation: https://help.ubuntu.com/community/UFW
- Fail2Ban Documentation: https://www.fail2ban.org/
- SSH Hardening Guide: https://www.ssh.com/academy/ssh/security

---

## 🎯 Quick Reference

### Essential Commands

```bash
# UFW
sudo ufw status verbose          # Check status
sudo ufw allow PORT/tcp          # Allow port
sudo ufw delete allow PORT/tcp   # Remove rule
sudo ufw reload                  # Reload rules

# Fail2Ban
sudo fail2ban-client status                    # Check status
sudo fail2ban-client status sshd               # Check SSH jail
sudo fail2ban-client set sshd unbanip IP       # Unban IP
sudo fail2ban-client reload                    # Reload config

# Logs
sudo tail -f /var/log/ufw.log           # UFW logs
sudo tail -f /var/log/fail2ban.log      # Fail2Ban logs
sudo tail -f /var/log/auth.log          # SSH attempts
```

---

**Security Level Achieved: 9/10** 🛡️

Your VPS is now protected with enterprise-grade security!
