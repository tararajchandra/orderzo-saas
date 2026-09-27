# 📚 VPS Deployment Documentation Index

Welcome! This folder contains everything you need to deploy your Ruchi Restaurant app to a VPS with Coolify and Stalwart Mail Server.

---

## 🎯 Quick Start

**New to deployment?** Start here:
1. Read **DEPLOYMENT_QUICKSTART.md** (30 minutes)
2. Follow **DEPLOYMENT_CHECKLIST.md** (2-3 hours)
3. Keep **TROUBLESHOOTING_VPS.md** open for reference

**Experienced with deployment?** Jump to:
- **DEPLOYMENT_VPS_COOLIFY.md** for detailed guide

---

## 📖 Documentation Files

### 1. DEPLOYMENT_QUICKSTART.md ⚡
**Purpose:** Get up and running fast  
**Time:** 2-3 hours  
**Best for:** First-time deployers who want step-by-step commands

**Contains:**
- Copy-paste commands for each phase
- Quick troubleshooting tips
- Credentials template
- Time estimates for each step

**Start here if:** You want to deploy quickly with minimal reading

---

### 2. DEPLOYMENT_VPS_COOLIFY.md 📘
**Purpose:** Comprehensive deployment guide  
**Time:** Reference document  
**Best for:** Understanding the full deployment process

**Contains:**
- Detailed explanations of each step
- VPS initial setup
- Coolify installation and configuration
- Stalwart Mail Server setup
- DNS configuration
- Application deployment
- Security best practices
- Monitoring and backups
- Scaling considerations

**Start here if:** You want to understand what you're doing

---

### 3. DEPLOYMENT_CHECKLIST.md ✅
**Purpose:** Track your deployment progress  
**Time:** Use throughout deployment  
**Best for:** Ensuring nothing is missed

**Contains:**
- Printable checklist format
- Every step with checkbox
- Credentials tracking
- Testing verification
- Post-deployment tasks

**Start here if:** You want a structured approach

---

### 5. SECURITY_SETUP_GUIDE.md 🛡️
**Purpose:** Complete VPS security hardening  
**Time:** 15 minutes setup + ongoing monitoring  
**Best for:** Securing your VPS with UFW and Fail2Ban

**Contains:**
- UFW firewall configuration
- Fail2Ban intrusion prevention
- SSH hardening (key auth, disable root)
- Automatic security updates
- Security monitoring scripts
- Emergency procedures
- Advanced hardening techniques

**Start here if:** You want enterprise-grade security

---

### 6. TROUBLESHOOTING_VPS.md 🔧
**Purpose:** Fix common issues  
**Time:** Reference when needed  
**Best for:** Solving problems during/after deployment

**Contains:**
- 10 most common issues
- Step-by-step solutions
- Monitoring commands
- Emergency procedures
- Performance optimization
- Preventive maintenance

**Start here if:** Something isn't working

---

### 7. GOOGLE_OAUTH_SETUP.md 🔐
**Purpose:** Configure Google sign-in  
**Time:** 30 minutes  
**Best for:** Adding Google authentication

**Contains:**
- Google Cloud Console setup
- OAuth credentials creation
- Environment variable configuration
- Testing procedures
- Production deployment notes

**Start here if:** You want Google login

---

### 8. GOOGLE_OAUTH_QUICKFIX.md ⚡
**Purpose:** Quick Google OAuth setup  
**Time:** 5 minutes  
**Best for:** Quick reference

**Contains:**
- Condensed setup steps
- Essential commands only
- Quick troubleshooting

**Start here if:** You just need the basics

---

### 9. DEPLOYMENT_QUICK_REFERENCE.md 📋
**Purpose:** Quick command reference  
**Time:** Keep open during deployment  
**Best for:** Quick lookups

**Contains:**
- Essential commands
- Common issues & fixes
- Environment variables template
- Monitoring commands
- Emergency procedures

**Start here if:** You need quick answers

---

## 🗂️ Configuration Files

### .env.production.template
Template for production environment variables. Copy to Coolify.

### .coolify
Coolify-specific configuration (build settings, resource limits).

### .dockerignore
Optimizes Docker build by excluding unnecessary files.

### app/api/health/route.ts
Health check endpoint for monitoring app status.

---

## 🚀 Recommended Deployment Flow

### For First-Time Deployers:

```
1. Read DEPLOYMENT_QUICKSTART.md (30 min)
   ↓
2. Open DEPLOYMENT_CHECKLIST.md (print it!)
   ↓
3. Follow checklist step-by-step (2-3 hours)
   ↓
4. Keep TROUBLESHOOTING_VPS.md open
   ↓
5. If issues arise, check troubleshooting guide
   ↓
6. After deployment, set up Google OAuth (optional)
```

### For Experienced Deployers:

```
1. Skim DEPLOYMENT_VPS_COOLIFY.md
   ↓
2. Use DEPLOYMENT_CHECKLIST.md for tracking
   ↓
3. Reference TROUBLESHOOTING_VPS.md as needed
```

---

## 💡 Key Information

### System Requirements
- **VPS:** 2 Core CPU, 2GB RAM
- **OS:** Ubuntu 22.04 or 24.04 LTS
- **Disk:** Minimum 20GB
- **Swap:** 2GB (critical!)

### Services Installed
1. **Coolify** - Deployment platform (port 8000)
2. **Stalwart** - Mail server (ports 25, 587, 465, 993, 143, 8080)
3. **PostgreSQL** - Database (internal)
4. **Your App** - Ruchi Restaurant (port 3000)

### Estimated Costs
- **VPS:** $5-10/month (DigitalOcean, Vultr, Linode)
- **Domain:** $10-15/year
- **Total:** ~$70-130/year

### Time Investment
- **Initial Setup:** 2-3 hours
- **Learning Curve:** 1-2 hours
- **Maintenance:** 30 min/week
- **Total First Time:** 4-6 hours

---

## 🎓 Learning Path

### Phase 1: Understanding (1 hour)
- Read about Coolify
- Understand Docker basics
- Learn about mail servers
- Review Next.js deployment

### Phase 2: Preparation (30 minutes)
- Get VPS credentials
- Set up domain
- Prepare GitHub repo
- Gather all credentials

### Phase 3: Deployment (2-3 hours)
- Follow DEPLOYMENT_QUICKSTART.md
- Use DEPLOYMENT_CHECKLIST.md
- Test thoroughly

### Phase 4: Optimization (ongoing)
- Monitor performance
- Optimize resources
- Implement backups
- Security hardening

---

## 🔍 Quick Reference

### Essential Commands

```bash
# Check system resources
free -h                    # Memory
df -h                      # Disk
docker stats               # Container resources

# Service management
systemctl status coolify   # Coolify status
docker ps                  # Running containers
docker logs app-name       # View logs

# Maintenance
docker system prune -a     # Clean Docker
apt update && apt upgrade  # Update system
```

### Important URLs

```
Coolify: http://YOUR_VPS_IP:8000
Stalwart: http://YOUR_VPS_IP:8080
Your App: https://yourdomain.com
Health Check: https://yourdomain.com/api/health
```

### Support Resources

- **Coolify Docs:** https://coolify.io/docs
- **Coolify Discord:** https://discord.gg/coolify
- **Stalwart Docs:** https://stalw.art/docs
- **Next.js Docs:** https://nextjs.org/docs/deployment

---

## ⚠️ Important Notes

### Before You Start
1. ✅ Backup your local database
2. ✅ Test everything locally
3. ✅ Have all credentials ready
4. ✅ Set aside 3-4 hours
5. ✅ Have your domain ready

### During Deployment
1. 🔴 Don't skip the swap file setup
2. 🔴 Save all credentials immediately
3. 🔴 Test each step before moving on
4. 🔴 Keep the checklist updated
5. 🔴 Monitor resource usage

### After Deployment
1. ✅ Set up backups immediately
2. ✅ Test all features thoroughly
3. ✅ Monitor for 24 hours
4. ✅ Document any issues
5. ✅ Plan regular maintenance

---

## 🆘 Getting Help

### If You're Stuck

1. **Check TROUBLESHOOTING_VPS.md** first
2. **Review logs** for error messages
3. **Search Coolify Discord** for similar issues
4. **Check documentation** for the specific service
5. **Ask in Coolify Discord** with:
   - What you're trying to do
   - What error you're getting
   - What you've already tried
   - Relevant logs

### Common Mistakes to Avoid

❌ Skipping swap file creation (causes OOM errors)  
❌ Not waiting for DNS propagation (causes SSL errors)  
❌ Wrong database host in env vars (causes connection errors)  
❌ Forgetting to run migrations (causes app errors)  
❌ Not setting up backups (risk of data loss)

---

## 📊 Success Metrics

After deployment, verify these metrics:

- [ ] **Uptime:** 99%+ (check after 1 week)
- [ ] **Page Load:** < 3 seconds
- [ ] **Memory Usage:** < 80% average
- [ ] **CPU Usage:** < 60% average
- [ ] **Disk Usage:** < 70%
- [ ] **Email Delivery:** 100% (test 10 emails)
- [ ] **SSL Score:** A+ (SSL Labs)
- [ ] **Backup Success:** 100%

---

## 🎯 Next Steps After Deployment

### Week 1
- Monitor daily
- Fix any issues immediately
- Gather user feedback
- Optimize performance

### Month 1
- Review analytics
- Plan feature updates
- Optimize costs
- Improve documentation

### Ongoing
- Weekly maintenance
- Monthly security updates
- Quarterly performance review
- Continuous improvement

---

## 📝 Deployment Log Template

Keep a deployment log for future reference:

```
Deployment Date: ___/___/______
VPS Provider: _________________
VPS IP: _______________________
Domain: _______________________
Coolify Version: ______________
Issues Encountered: ___________
_______________________________
_______________________________
Resolution: ___________________
_______________________________
_______________________________
Total Time: _______ hours
Notes: ________________________
_______________________________
_______________________________
```

---

## 🎉 Ready to Deploy?

1. **Choose your starting point:**
   - Quick deployment → DEPLOYMENT_QUICKSTART.md
   - Detailed guide → DEPLOYMENT_VPS_COOLIFY.md
   - Structured approach → DEPLOYMENT_CHECKLIST.md

2. **Prepare your environment:**
   - VPS access ready
   - Domain configured
   - GitHub repo ready
   - Credentials documented

3. **Set aside time:**
   - First deployment: 3-4 hours
   - Testing: 1 hour
   - Buffer: 1 hour

4. **Start deploying!** 🚀

---

**Good luck with your deployment!**

If you have questions, check the troubleshooting guide or reach out to the Coolify community.

---

*Last Updated: January 2026*  
*For: Ruchi Restaurant App v1.0*  
*VPS Spec: 2 Core CPU, 2GB RAM*
