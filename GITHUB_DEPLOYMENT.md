# GitHub Deployment Guide

## Step-by-Step Guide to Deploy RuchiV2 to GitHub

### Prerequisites

- Git installed on your computer
- GitHub account
- Project ready to deploy

## 🚀 Deployment Steps

### Step 1: Initialize Git Repository

```bash
# Navigate to project directory
cd e:\Project\webDevelop\RuchiV2

# Initialize git repository
git init

# Check status
git status
```

### Step 2: Create .env.example

Create a `.env.example` file (template for others):

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Application


# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
```

**Important**: Never commit your actual `.env` file!

### Step 3: Add All Files to Git

```bash
# Add all files (respects .gitignore)
git add .

# Check what will be committed
git status

# Commit with message
git commit -m "Initial commit: Ruchi Restaurant Management System V2"
```

### Step 4: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click **"New repository"** (+ icon in top right)
3. Fill in details:
   - **Repository name**: `RuchiV2` or `ruchi-restaurant-management`
   - **Description**: "Restaurant management system with menu, orders, delivery tracking, and invoicing"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (we already have one)
4. Click **"Create repository"**

### Step 5: Link Local Repository to GitHub

GitHub will show you commands. Use these:

```bash
# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/RuchiV2.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 6: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files
3. README.md should be displayed on the main page

## ✅ What Gets Uploaded

### Included:
- ✅ Source code (`app/`, `lib/`, etc.)
- ✅ Database schema and migrations
- ✅ Documentation files
- ✅ Configuration files (`package.json`, `tsconfig.json`)
- ✅ Import templates
- ✅ `.gitignore` and `.env.example`

### Excluded (by .gitignore):
- ❌ `node_modules/` (dependencies)
- ❌ `.env` (sensitive credentials)
- ❌ `.next/` (build files)
- ❌ Export data files (`*_2025-*.json`)
- ❌ Database backups
- ❌ IDE settings

## 🔒 Security Checklist

Before pushing to GitHub:

- [ ] `.env` file is in `.gitignore`
- [ ] No database passwords in code
- [ ] No API keys in code
- [ ] `.env.example` has placeholder values only
- [ ] Sensitive data files are excluded

## 📝 Future Updates

### Making Changes

```bash
# Check what changed
git status

# Add specific files
git add path/to/file

# Or add all changes
git add .

# Commit with descriptive message
git commit -m "Add feature: bulk image upload"

# Push to GitHub
git push
```

### Creating Branches

```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Implement new feature"

# Push branch to GitHub
git push -u origin feature/new-feature

# Create Pull Request on GitHub
```

## 🌐 Deploy to Vercel (Optional)

### Quick Deploy

1. Go to [Vercel](https://vercel.com)
2. Click **"Import Project"**
3. Select your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Add Environment Variables:
   ```
   DB_HOST=your_production_db_host
   DB_PORT=5432
   DB_NAME=restaurant_db
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   JWT_SECRET=your_production_jwt_secret
   ```

6. Click **"Deploy"**

### Database Setup for Production

You'll need a PostgreSQL database. Options:

1. **Vercel Postgres** (recommended for Vercel)
2. **Supabase** (free tier available)
3. **Railway** (free tier available)
4. **Neon** (serverless Postgres)

## 🐛 Troubleshooting

### "Permission denied" Error

```bash
# Use HTTPS instead of SSH
git remote set-url origin https://github.com/YOUR_USERNAME/RuchiV2.git
```

### "Failed to push" Error

```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push
```

### Large Files Warning

If you get warnings about large files:

```bash
# Check file sizes
git ls-files -s | sort -k 4 -n -r | head -10

# Remove large files from git
git rm --cached path/to/large/file

# Add to .gitignore
echo "path/to/large/file" >> .gitignore

# Commit and push
git commit -m "Remove large files"
git push
```

## 📚 Git Best Practices

### Commit Messages

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Fix: Database timeout issue in import"
git commit -m "Feature: Add bulk image upload"
git commit -m "Docs: Update README with deployment guide"

# Bad
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
```

### Commit Often

- Commit logical units of work
- Don't commit broken code
- Test before committing

### Branch Naming

```bash
feature/add-payment-gateway
bugfix/fix-image-upload
hotfix/critical-security-patch
docs/update-readme
```

## 🎯 Next Steps

After deploying to GitHub:

1. **Add Collaborators** (if team project)
   - Go to Settings → Collaborators
   - Add team members

2. **Set Up GitHub Actions** (CI/CD)
   - Automated testing
   - Automated deployment

3. **Create Issues** for tracking
   - Bug reports
   - Feature requests
   - Enhancements

4. **Add Topics** to repository
   - `nextjs`, `typescript`, `postgresql`
   - `restaurant-management`, `pos-system`

5. **Star Your Repo** ⭐ (for visibility)

## 📞 Need Help?

- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [Vercel Documentation](https://vercel.com/docs)

---

**Ready to deploy?** Follow the steps above and your project will be on GitHub in minutes! 🚀
