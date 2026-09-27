#!/bin/bash

# Deployment Preparation Script for Ruchi Restaurant App
# This script helps prepare your app for deployment

echo "🚀 Ruchi Restaurant - Deployment Preparation"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "⚠️  Git repository not initialized"
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ruchi Restaurant App"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository found"
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "⚠️  You have uncommitted changes"
    echo "Committing changes..."
    git add .
    git commit -m "Pre-deployment commit - $(date +%Y-%m-%d)"
    echo "✅ Changes committed"
else
    echo "✅ No uncommitted changes"
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found"
    echo "Creating from template..."
    cp .env.production.example .env.production
    echo "⚠️  Please edit .env.production with your production values"
else
    echo "✅ .env.production found"
fi

# Test build
echo ""
echo "🔨 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - please fix errors before deploying"
    exit 1
fi

# Check for common issues
echo ""
echo "🔍 Checking for common issues..."

# Check package.json
if grep -q '"build": "next build"' package.json; then
    echo "✅ Build script configured"
else
    echo "⚠️  Build script not found in package.json"
fi

# Check for node version
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Push code to GitHub: git push origin main"
echo "2. Sign up for hosting (Vercel recommended)"
echo "3. Set up PostgreSQL database (Neon recommended)"
echo "4. Configure environment variables"
echo "5. Deploy!"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
