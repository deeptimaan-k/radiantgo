# RadiantGo Performance & Scalability Guide

## High-Volume Requirements

RadiantGo is designed to handle:
- **50,000 new bookings per day** (~0.6 bookings/second average, ~10 bookings/second peak)
- **150,000 status updates per day** (~1.7 updates/second average, ~30 updates/second peak)
- **100,000 flights** in the system
- **~10 flights per route per day** between any origin-destination pair

## Concurrency Control

### Distributed Locking Strategy

The system uses Redis-based distributed locks to handle concurrent operations:

```javascript
// Automatic lock acquisition with retry and backoff
const lockInfo = await distributedLock.acquire('booking:ref:RG123ABC456', 30);
try {
  // Critical section - only one process can execute this
  await updateBookingStatus(bookingId, newStatus);
} finally {
  await distributedLock.release(lockInfo);
}
```

### Lock Types and Granularity

1. **Booking-level locks**: `booking:ref:{ref_id}`
   - Used for status updates, cancellations
   - TTL: 30 seconds
   - Prevents race conditions on booking modifications

2. **Flight-level locks**: `flight:{flight_number}`
   - Used for flight updates, capacity management
   - TTL: 15 seconds

3. **Bulk operation locks**: `bulk:operation:{type}:{timestamp}`
   - Used for bulk imports and updates
   - TTL: 60 seconds

### Lock Acquisition Strategy

- **Exponential backoff**: 100ms → 150ms → 225ms → 337ms...
- **Maximum retries**: 50 attempts (up to ~30 seconds total wait)
- **Jitter**: Random 0-100ms added to prevent thundering herd
- **Automatic cleanup**: Locks released on request completion or timeout

## Performance Optimizations

### Database Optimization

#### Indexes for High-Volume Queries
```javascript
// Critical indexes for 50K+ daily operations
db.bookings.createIndex({ "ref_id": 1 }, { unique: true });
db.bookings.createIndex({ "status": 1, "updated_at": -1 });
db.bookings.createIndex({ "origin": 1, "destination": 1, "created_at": -1 });

// Flight search optimization for 100K flights
db.flights.createIndex({ "origin": 1, "destination": 1, "departure_ts": 1 });
db.flights.createIndex({ "flight_number": 1 }, { unique: true });

// Event timeline optimization
db.booking_events.createIndex({ "booking_id": 1, "at_ts": -1 });
```

#### Connection Pool Optimization
```javascript
// MongoDB connection pool for high volume
mongoose.set('maxPoolSize', 50);        // 50 concurrent connections
mongoose.set('minPoolSize', 10);        // Always keep 10 connections warm
mongoose.set('maxIdleTimeMS', 30000);   // Close idle connections after 30s
mongoose.set('bufferMaxEntries', 0);    // Disable buffering for immediate errors
```

### Caching Strategy

#### Multi-Level Caching
1. **Route searches**: 5 minutes TTL (high compute cost)
2. **Flight data**: 1 hour TTL (relatively static)
3. **Booking details**: 30 seconds TTL (frequently updated)
4. **User data**: 30 minutes TTL (rarely changes)

#### Cache Warming
```javascript
// Pre-populate popular routes
const popularRoutes = [
  { origin: 'DEL', destination: 'BLR' },
  { origin: 'NYC', destination: 'LAX' },
  // ... more popular routes
];

// Warm cache for today and tomorrow
await cacheService.warmCache();
```

#### Cache Invalidation
- **Booking updates**: Invalidate `booking:details:{ref_id}` and `bookings:page:*`
- **Flight updates**: Invalidate `flights:*` and `routes:*`
- **Bulk operations**: Pattern-based invalidation

### Rate Limiting

#### Endpoint-Specific Limits
```javascript
// Booking creation: 50 per minute per IP
// Status updates: 200 per minute per IP  
// Route searches: 30 per minute per IP
// Admin operations: 10 per 5 minutes per IP
// Bulk operations: 5 per 10 minutes per IP
```

## Bulk Operations

### Bulk Booking Creation
```bash
POST /api/admin/bookings/bulk
{
  "bookings": [
    {
      "origin": "DEL",
      "destination": "BLR", 
      "pieces": 5,
      "weight_kg": 125.5,
      "customer_name": "Acme Corp",
      "customer_email": "shipping@acme.com"
    }
    // ... up to 1000 bookings
  ]
}
```

### Bulk Status Updates
```bash
POST /api/admin/bookings/status/bulk
{
  "updates": [
    {
      "ref_id": "RG123ABC456",
      "newStatus": "DEPARTED",
      "eventData": {
        "location": "DEL Airport",
        "notes": "Departed on schedule"
      }
    }
    // ... up to 500 updates
  ]
}
```

### Bulk Flight Import
```bash
POST /api/admin/flights/bulk
{
  "flights": [
    {
      "flight_number": "RG001",
      "airline": "RadiantGo Airlines",
      "origin": "NYC",
      "destination": "LAX",
      "departure_ts": "2025-01-20T10:00:00Z",
      "arrival_ts": "2025-01-20T16:00:00Z"
    }
    // ... up to 2000 flights
  ]
}
```

## Monitoring & Metrics

### Performance Metrics
- **Request throughput**: Requests per second by endpoint
- **Response times**: P50, P95, P99 percentiles
- **Cache hit rates**: By cache type and key pattern
- **Lock contention**: Acquisition times and retry counts
- **Error rates**: By endpoint and error type

### Health Checks
```bash
GET /health
{
  "status": "healthy",
  "services": {
    "redis": { "status": "healthy", "latency": 5 },
    "database": { "status": "healthy", "latency": 15 }
  },
  "metrics": {
    "totalRequests": 15420,
    "cacheHitRate": "87.3%",
    "averageResponseTime": 145,
    "requestsPerSecond": "12.5"
  }
}
```

### Auto-Scaling Recommendations
```bash
GET /api/admin/performance
{
  "scalingRecommendations": [
    {
      "type": "scale_up",
      "component": "backend", 
      "reason": "High request rate: 125.2 req/s",
      "priority": "HIGH"
    }
  ]
}
```

## Load Testing Scenarios

### Booking Creation Load Test
```bash
# Simulate 50K bookings per day (peak: 10/sec for 1 hour)
for i in {1..36000}; do
  curl -X POST http://localhost:5000/api/bookings \
    -H "Content-Type: application/json" \
    -d '{"origin":"DEL","destination":"BLR","pieces":5,"weight_kg":125.5}' &
  
  if (( i % 10 == 0 )); then
    wait # Wait for batch to complete
    sleep 1 # 1 second between batches = 10 req/sec
  fi
done
```

### Status Update Load Test
```bash
# Simulate 150K updates per day (peak: 30/sec for 1 hour)
for i in {1..108000}; do
  REF_ID="RG$(date +%s)$(shuf -i 100-999 -n 1)"
  curl -X POST http://localhost:5000/api/bookings/${REF_ID}/depart \
    -H "Content-Type: application/json" \
    -d '{"location":"Airport","notes":"Departed"}' &
  
  if (( i % 30 == 0 )); then
    wait
    sleep 1 # 30 req/sec
  fi
done
```

## Production Deployment

### Resource Requirements

#### Minimum Production Setup
- **Backend**: 2 CPU cores, 4GB RAM, 20GB storage
- **MongoDB**: 4 CPU cores, 8GB RAM, 100GB SSD
- **Redis**: 2 CPU cores, 2GB RAM, 10GB storage
- **RabbitMQ**: 2 CPU cores, 2GB RAM, 20GB storage

#### High-Volume Production Setup
- **Backend**: 4-8 CPU cores, 8-16GB RAM (horizontal scaling)
- **MongoDB**: 8+ CPU cores, 16-32GB RAM, 500GB+ SSD with replica set
- **Redis**: 4 CPU cores, 8GB RAM with clustering
- **Load Balancer**: Nginx/HAProxy for backend scaling

### Environment Variables for Production
```env
# Performance tuning
NODE_ENV=production
MONGODB_URI=mongodb://admin:password@mongo-cluster:27017/radiantgo?replicaSet=rs0
REDIS_URL=redis://redis-cluster:6379
RABBITMQ_URL=amqp://admin:password@rabbitmq-cluster:5672

# Rate limiting (per minute)
RATE_LIMIT_BOOKINGS=50
RATE_LIMIT_UPDATES=200
RATE_LIMIT_ROUTES=30

# Cache TTL (seconds)
CACHE_TTL_ROUTES=300
CACHE_TTL_FLIGHTS=3600
CACHE_TTL_BOOKINGS=60

# Bulk operation limits
BULK_BOOKING_LIMIT=1000
BULK_UPDATE_LIMIT=500
BULK_FLIGHT_LIMIT=2000

# Performance settings
DB_POOL_SIZE=50
DB_POOL_MIN=10
LOCK_DEFAULT_TTL=30
LOCK_MAX_RETRIES=50
```

### Horizontal Scaling

#### Backend Scaling
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 4
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

#### Load Balancer Configuration
```nginx
upstream backend {
    least_conn;
    server backend-1:5000 max_fails=3 fail_timeout=30s;
    server backend-2:5000 max_fails=3 fail_timeout=30s;
    server backend-3:5000 max_fails=3 fail_timeout=30s;
    server backend-4:5000 max_fails=3 fail_timeout=30s;
}

server {
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Connection pooling
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # Timeouts for high volume
        proxy_connect_timeout 5s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

## Troubleshooting

### Common Performance Issues

1. **High Lock Contention**
   - Symptoms: 409 errors, slow response times
   - Solution: Reduce lock TTL, optimize critical sections

2. **Low Cache Hit Rate**
   - Symptoms: High database load, slow route searches
   - Solution: Increase cache TTL, warm popular routes

3. **Database Connection Pool Exhaustion**
   - Symptoms: Connection timeout errors
   - Solution: Increase pool size, optimize query performance

4. **Memory Leaks in Bulk Operations**
   - Symptoms: Increasing memory usage, OOM errors
   - Solution: Process smaller batches, implement backpressure

### Monitoring Commands

```bash
# Check system performance
curl http://localhost:5000/api/admin/performance

# View active locks
curl http://localhost:5000/api/admin/locks

# Cache statistics
curl http://localhost:5000/api/admin/cache/stats

# Warm cache manually
curl -X POST http://localhost:5000/api/admin/cache/warm

# Clear all caches
curl -X DELETE http://localhost:5000/api/admin/cache/clear
```

### Performance Benchmarks

#### Target Performance (Production)
- **Booking creation**: < 200ms P95 response time
- **Status updates**: < 100ms P95 response time  
- **Route searches**: < 500ms P95 response time (cached: < 50ms)
- **Cache hit rate**: > 85% for route searches
- **Lock acquisition**: < 50ms P95 time
- **Bulk operations**: > 50 items/second throughput

#### Alerting Thresholds
- **Response time P95 > 1000ms**: Scale up backend
- **Cache hit rate < 70%**: Optimize caching strategy
- **Lock acquisition time > 500ms**: Reduce lock contention
- **Error rate > 1%**: Investigate and fix issues
- **Memory usage > 80%**: Scale up or optimize memory usage