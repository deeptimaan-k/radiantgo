# RadiantGo Deployment Guide

## Prerequisites

### System Requirements
- Node.js 18+ 
- Docker & Docker Compose
- MongoDB 7+
- Redis 7+
- 4GB RAM minimum
- 20GB disk space

### Environment Setup

#### Development Environment
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd radiantgo
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run docker:up  # Start MongoDB & Redis
   npm run seed       # Seed database with sample data
   npm run dev        # Start development server
   ```

3. **Frontend Setup**
   ```bash
   cd ../
   npm install
   npm run dev        # Start frontend development server
   ```

#### Production Environment

### Docker Deployment

#### Using Docker Compose (Recommended)
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://api:3000/api
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/radiantgo
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=radiantgo

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:
```

#### Deployment Commands
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Cloud Deployment

#### AWS Deployment
1. **ECS with Fargate**
   - Container orchestration
   - Auto-scaling capabilities
   - Load balancing

2. **Database Services**
   - MongoDB Atlas or DocumentDB
   - ElastiCache for Redis

3. **Additional Services**
   - CloudFront for CDN
   - Route 53 for DNS
   - CloudWatch for monitoring

#### Configuration
```bash
# Environment variables for production
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/radiantgo
REDIS_URL=redis://elasticache-endpoint:6379
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
```

### Performance Tuning

#### Database Optimization
```javascript
// MongoDB connection with production settings
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  bufferMaxEntries: 0
});
```

#### Redis Configuration
```bash
# redis.conf for production
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Monitoring Setup

#### Health Checks
```bash
# Application health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/health | jq '.services.mongodb.status'

# Redis health
curl http://localhost:3000/health | jq '.services.redis.status'
```

#### Log Management
```bash
# Centralized logging with ELK stack
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  elasticsearch:7.17.0

docker run -d \
  --name kibana \
  -p 5601:5601 \
  --link elasticsearch:elasticsearch \
  kibana:7.17.0
```

### Security Hardening

#### Production Security Checklist
- [ ] Change default JWT secret
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Regular security updates
- [ ] Database access controls
- [ ] Redis authentication
- [ ] Environment variable security

#### SSL/TLS Configuration
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Backup Strategy

#### Database Backups
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/radiantgo" --out=/backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb"

# Redis backup
redis-cli --rdb "$BACKUP_DIR/redis/dump.rdb"

# Compress and upload to S3
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
aws s3 cp "$BACKUP_DIR.tar.gz" s3://your-backup-bucket/
```

### Disaster Recovery

#### Recovery Procedures
1. **Database Recovery**
   ```bash
   # Restore MongoDB
   mongorestore --uri="mongodb://localhost:27017/radiantgo" /backup/mongodb/radiantgo
   
   # Restore Redis
   redis-cli --rdb /backup/redis/dump.rdb
   ```

2. **Application Recovery**
   - Deploy from latest stable image
   - Restore environment variables
   - Verify health checks
   - Gradual traffic restoration

### Scaling Strategy

#### Horizontal Scaling
```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: radiantgo-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: radiantgo-backend
  template:
    spec:
      containers:
      - name: backend
        image: radiantgo/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: radiantgo-secrets
              key: mongodb-uri
```

#### Auto-scaling Configuration
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: radiantgo-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: radiantgo-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Performance Benchmarks

#### Target Performance Metrics
- **API Response Time**: < 200ms (95th percentile)
- **Database Query Time**: < 50ms (average)
- **Cache Hit Rate**: > 80%
- **Throughput**: 1000 requests/second
- **Availability**: 99.9% uptime

#### Load Testing
```bash
# Using Artillery.js
npm install -g artillery

# Load test configuration
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "Booking flow"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.data.token"
              as: "token"
      - get:
          url: "/api/flights/routes"
          qs:
            origin: "DEL"
            destination: "BOM"
            departure_date: "2024-01-15"
          headers:
            Authorization: "Bearer {{ token }}"

# Run load test
artillery run artillery.yml
```

### Maintenance Procedures

#### Regular Maintenance Tasks
1. **Database Maintenance**
   - Index optimization
   - Query performance analysis
   - Data archival for old bookings

2. **Cache Maintenance**
   - Memory usage monitoring
   - Cache hit rate analysis
   - Key expiration optimization

3. **Log Management**
   - Log rotation
   - Archive old logs
   - Disk space monitoring

4. **Security Updates**
   - Dependency updates
   - Security patch deployment
   - Vulnerability scanning