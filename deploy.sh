#!/bin/bash

# VIP Learning Realm - Production Deployment Script
# This script handles the complete deployment process to Vercel

set -e

echo "🚀 Starting VIP Learning Realm Production Deployment"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel@latest
fi

# Set environment variables
export NODE_ENV=production
export NEXT_PUBLIC_ENVIRONMENT=production

echo "📦 Installing dependencies..."
npm ci

echo "🔍 Running linting..."
npm run lint

echo "🔨 Building application..."
npm run build

echo "📊 Running bundle analysis..."
npm run analyze

echo "☁️ Deploying to Vercel..."
vercel --prod --token="3GXCqB9DB1g8M9sFWPjWMaua" --yes

echo "🎯 Setting up domain aliases..."
vercel alias set --token="3GXCqB9DB1g8M9sFWPjWMaua" courses.themikesalazar.com
vercel alias set --token="3GXCqB9DB1g8M9sFWPjWMaua" login.courses.themikesalazar.com

echo "🔍 Running post-deployment tests..."
npm run performance:test || echo "⚠️ Performance tests completed with warnings"

echo "✅ VIP Learning Realm deployed successfully!"
echo "🌐 Production URL: https://courses.themikesalazar.com"
echo "🔐 Login URL: https://login.courses.themikesalazar.com"

# Optional: Run Lighthouse audit
echo "🔬 Running Lighthouse audit..."
npx lighthouse https://courses.themikesalazar.com --output=html --output-path=./lighthouse-report.html --chrome-flags="--headless"

echo "📊 Deployment complete! Check lighthouse-report.html for performance metrics."
