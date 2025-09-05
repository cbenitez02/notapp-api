#!/bin/bash

# VPS server deployment script
# Run this script on your VPS server

set -e

PROJECT_NAME="notapp-api"
IMAGE_NAME="notapp-api:latest"

echo "🚀 Deploying $PROJECT_NAME on VPS..."

# Pull latest changes (if using git on server)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin master
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Remove old image (optional)
echo "🗑️ Removing old images..."
docker image prune -f

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait a moment for services to start
sleep 10

# Check if services are running
echo "🔍 Checking service health..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20 api

echo "✅ Deployment completed!"
echo "🌐 API should be available at: http://your-vps-ip:3000"
echo "📊 Health check: http://your-vps-ip:3000/health"
