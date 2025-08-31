# RadiantGo Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for full stack)

### WebContainer Development
```bash
# Start frontend
cd frontend && npm install && npm run dev

# Start backend (new terminal)
cd backend && npm install && npm run dev
```

### Full Docker Development
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Production Deployment

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password@mongo:27017/radiantgo?authSource=admin
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
FRONTEND_URL=http://frontend:3000
JWT_SECRET=your-super-secret-jwt-key
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

### Docker Commands

```bash
# Build specific service
docker-compose build [service-name]

# Scale services
docker-compose up --scale backend=3

# Update single service
docker-compose up -d --no-deps backend

# View service logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend sh
docker-compose exec mongo mongosh

# Backup MongoDB
docker-compose exec mongo mongodump --archive=/backup.archive --db=radiantgo

# Restore MongoDB
docker-compose exec mongo mongorestore --archive=/backup.archive --db=radiantgo
```

### Health Checks

All services expose health check endpoints:

- **Backend:** `GET /health`
- **MongoDB:** Container health check via Docker
- **Redis:** Container health check via Docker
- **RabbitMQ:** Management UI at http://localhost:15672

### Monitoring

#### Service Status
```bash
# Check all services
docker-compose ps

# Service resource usage
docker stats
```

#### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Error logs only
docker-compose logs -f backend | grep ERROR
```

### Security Considerations

1. **Environment Variables**: Never commit sensitive environment variables
2. **Database Security**: Use strong passwords and limit network access
3. **API Security**: Implement JWT authentication for production
4. **HTTPS**: Use reverse proxy (nginx/traefik) with SSL certificates
5. **CORS**: Configure CORS properly for production domains

### Performance Optimization

1. **Redis Caching**: Implement Redis for API response caching
2. **Database Indexing**: Ensure proper indexes are created
3. **Load Balancing**: Use multiple backend instances behind load balancer
4. **CDN**: Serve static assets via CDN
5. **Compression**: Enable gzip compression for API responses

### Backup Strategy

1. **MongoDB**: Regular automated backups with point-in-time recovery
2. **Redis**: Snapshot backups for cache warm-up
3. **Application**: Source code versioning with Git
4. **Configuration**: Backup Docker Compose and environment files