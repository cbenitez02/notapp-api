#!/bin/bash

# Production deployment script for VPS
# Make sure to run this script from the project root directory

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Environment validation
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Copy .env.example and configure it first."
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate

# Run tests
echo "🧪 Running tests..."
npm run test

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t notapp-api:latest .

# Optional: Tag with version
if [ ! -z "$1" ]; then
    docker tag notapp-api:latest notapp-api:$1
    echo "✅ Tagged image as notapp-api:$1"
fi

echo "✅ Deployment preparation completed!"
echo "📝 Next steps:"
echo "   1. Copy .env file to your VPS"
echo "   2. Run: docker-compose up -d"
echo "   3. Check logs: docker-compose logs -f api"
