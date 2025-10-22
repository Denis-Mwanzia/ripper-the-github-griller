#!/bin/bash

# Firebase Deployment Script for BillIntel
echo "🚀 Starting Firebase deployment for BillIntel..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

# Build the project
echo "📦 Building project..."
pnpm nx build billintel-web
pnpm nx build genkit

# Check if builds were successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build completed successfully!"

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy

# Check deployment status
if [ $? -eq 0 ]; then
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Your app is now live on Firebase!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi
