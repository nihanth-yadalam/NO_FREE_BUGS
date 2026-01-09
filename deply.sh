#!/bin/bash

# --- CONFIGURATION ---
# REPLACE THIS WITH YOUR EXACT DOCKER HUB USERNAME
HUB_USER="iksh" 
TAG="latest"

echo "----------------------------------------------------"
echo "🐋 Docker Hub Deployer for User: $HUB_USER"
echo "----------------------------------------------------"

# 1. Check Login Status
# We try to pull a dummy private image to test auth, or just force login
echo "🔑 Please verify your credentials..."
docker login

echo "🚀 Starting Build & Push workflow..."

# Function to build and push
build_and_push() {
    SERVICE=$1
    FOLDER=$2
    IMAGE_NAME="$HUB_USER/$SERVICE:$TAG"

    echo "----------------------------------------------------"
    echo "📦 Processing $SERVICE..."
    
    # Build
    echo "   Building $IMAGE_NAME from ./$FOLDER"
    docker build -t $IMAGE_NAME ./$FOLDER
    
    # Push
    echo "   Pushing to Docker Hub..."
    docker push $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo "✅ $SERVICE deployed successfully!"
    else
        echo "❌ ERROR: Failed to push $SERVICE. Check your permissions."
        exit 1
    fi
}

# Execute for all services
build_and_push "vaultguard-bank" "bank-api"
build_and_push "vaultguard-backend" "vaultguard-backend"
build_and_push "vaultguard-frontend" "vaultguard-frontend"

echo "----------------------------------------------------"
echo "🎉 SUCCESS! All images are live on Docker Hub."