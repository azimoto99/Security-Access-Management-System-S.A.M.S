#!/bin/bash

# Deployment script for Security Access Management System
# Usage: ./scripts/deploy.sh [environment]
# Environment: development, staging, production

set -e

ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

cd "$PROJECT_ROOT"

# Check for .env files
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found. Creating from .env.example..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "⚠️  Please update backend/.env with your production values before continuing."
    else
        echo "❌ backend/.env.example not found. Please create backend/.env manually."
        exit 1
    fi
fi

if [ ! -f "frontend/.env" ]; then
    echo "⚠️  Warning: frontend/.env not found. Creating from .env.example..."
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
        echo "⚠️  Please update frontend/.env with your production values before continuing."
    else
        echo "❌ frontend/.env.example not found. Please create frontend/.env manually."
        exit 1
    fi
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if backend is healthy
echo "🏥 Checking backend health..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend npm run db:migrate

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🌱 Seeding initial data..."
    docker-compose exec -T backend npm run db:seed || echo "⚠️  Seeding failed or already completed"
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🔗 Access points:"
echo "  - Frontend: http://localhost:80"
echo "  - Backend API: http://localhost:3001/api"
echo "  - Health Check: http://localhost:3001/api/health"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"





