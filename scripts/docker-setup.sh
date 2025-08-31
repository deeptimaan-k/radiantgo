#!/bin/bash

# RadiantGo Docker Setup Script
# This script helps you get started with the Docker environment

set -e

echo "🚀 RadiantGo Docker Setup"
echo "========================="

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

echo "✅ Docker and Docker Compose are available"

# Function to show usage
show_usage() {
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev      Start development environment with hot reloading"
    echo "  prod     Start production environment"
    echo "  build    Build all Docker images"
    echo "  stop     Stop all services"
    echo "  clean    Stop services and remove volumes (⚠️  DATA LOSS)"
    echo "  logs     Show logs from all services"
    echo "  status   Show status of all services"
    echo "  help     Show this help message"
    echo ""
}

# Parse command
COMMAND=${1:-help}

case $COMMAND in
    "dev")
        echo "🔧 Starting development environment..."
        echo "This will start all services with hot reloading enabled."
        echo ""
        docker-compose -f docker-compose.dev.yml up --build -d
        echo ""
        echo "✅ Development environment started!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔌 Backend API: http://localhost:5000"
        echo "🗄️  MongoDB: mongodb://localhost:27017"
        echo "📋 Redis: redis://localhost:6379"
        echo "🐰 RabbitMQ UI: http://localhost:15672 (guest/guest)"
        echo ""
        echo "📝 To view logs: docker-compose -f docker-compose.dev.yml logs -f"
        echo "🛑 To stop: docker-compose -f docker-compose.dev.yml down"
        ;;
    
    "prod")
        echo "🚀 Starting production environment..."
        echo "This will build and start all services in production mode."
        echo ""
        docker-compose up --build -d
        echo ""
        echo "✅ Production environment started!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔌 Backend API: http://localhost:5000"
        echo "🗄️  MongoDB: mongodb://localhost:27017"
        echo "📋 Redis: redis://localhost:6379"
        echo "🐰 RabbitMQ UI: http://localhost:15672 (guest/guest)"
        echo ""
        echo "📝 To view logs: docker-compose logs -f"
        echo "🛑 To stop: docker-compose down"
        ;;
    
    "build")
        echo "🔨 Building all Docker images..."
        docker-compose build --no-cache
        echo "✅ All images built successfully!"
        ;;
    
    "stop")
        echo "🛑 Stopping all services..."
        docker-compose down
        docker-compose -f docker-compose.dev.yml down
        echo "✅ All services stopped!"
        ;;
    
    "clean")
        echo "⚠️  WARNING: This will remove all data volumes!"
        echo "This action cannot be undone."
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🧹 Cleaning up containers and volumes..."
            docker-compose down -v
            docker-compose -f docker-compose.dev.yml down -v
            docker system prune -f
            echo "✅ Cleanup completed!"
        else
            echo "❌ Cleanup cancelled."
        fi
        ;;
    
    "logs")
        echo "📝 Showing logs from all services..."
        echo "Press Ctrl+C to exit log viewing"
        echo ""
        if docker-compose ps | grep -q "Up"; then
            docker-compose logs -f
        elif docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
            docker-compose -f docker-compose.dev.yml logs -f
        else
            echo "❌ No services are currently running."
            echo "Start services with: $0 dev  or  $0 prod"
        fi
        ;;
    
    "status")
        echo "📊 Service Status"
        echo "================"
        echo ""
        echo "Production services:"
        docker-compose ps
        echo ""
        echo "Development services:"
        docker-compose -f docker-compose.dev.yml ps
        echo ""
        echo "Docker system info:"
        docker system df
        ;;
    
    "help"|*)
        show_usage
        ;;
esac