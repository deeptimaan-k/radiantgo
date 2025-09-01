#!/bin/bash

# Start Docker services for RadiantGo
echo "Starting RadiantGo Docker services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker first."
    exit 1
fi

# Start Redis and MongoDB
echo "Starting Redis and MongoDB containers..."
docker-compose up -d redis mongodb

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check Redis health
echo "Checking Redis connection..."
docker-compose exec redis redis-cli ping

# Check MongoDB health
echo "Checking MongoDB connection..."
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

echo "Docker services are ready!"
echo "Redis: localhost:6379"
echo "MongoDB: localhost:27017"
echo ""
echo "To stop services: npm run docker:down"
echo "To view logs: npm run docker:logs"