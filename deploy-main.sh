#!/bin/bash

# Milo - Main Deployment Script
# Generated: 2025-11-03T20:25:27.720Z
# Deployment Type: DOCKER

echo "🚀 Milo Deployment"
echo "======================================="
echo "Deployment Type: DOCKER"
echo "Environment: PRODUCTION"
echo "Domain: localhost"
echo ""

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if required files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file missing!"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo "❌ Frontend .env file missing!"
    exit 1
fi

echo "✅ Configuration files found"

# Check dependencies
echo "📦 Checking dependencies..."


if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found! Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found! Please install Docker Compose first."
    exit 1
fi




echo "✅ Dependencies check passed"

# Run deployment
echo "🚀 Starting deployment..."

./deploy.sh


echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Run ./setup-ssl.sh to configure SSL certificates"
echo "3. Update your Discord bot settings with the new domain"
echo "4. Test your application thoroughly"
echo ""
echo "🌐 Application URLs:"
echo "Frontend: https://localhost"
echo "Backend API: https://localhost/api"

