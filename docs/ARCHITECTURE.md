# RadiantGo System Architecture

## High Level Design (HLD)

### System Overview
RadiantGo is a comprehensive air cargo booking and tracking platform designed to handle high-volume operations with real-time tracking capabilities.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ - Route Search  │    │ - Flight Mgmt   │    │ - Flights       │
│ - Booking Form  │    │ - Booking CRUD  │    │ - Bookings      │
│ - Tracking UI   │    │ - Status Updates│    │ - Users         │
│ - Auth Pages    │    │ - Authentication│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │                 │
                       │ - Caching       │
                       │ - Dist. Locks   │
                       │ - Idempotency   │
                       └─────────────────┘
```

### Core Components

#### Frontend (React + TypeScript)
- **Pages**: Login, Register, Create Booking, Track Booking
- **Components**: Reusable UI components with Tailwind CSS
- **State Management**: React hooks for local state
- **API Integration**: Axios with interceptors for auth and error handling
- **Routing**: React Router v6 with protected routes

#### Backend (Node.js + Express + TypeScript)
- **Layered Architecture**: Controllers → Services → Models
- **Authentication**: JWT-based with bcrypt password hashing
- **Validation**: Joi schemas for request validation
- **Error Handling**: Structured error responses with Problem JSON
- **Logging**: Winston for comprehensive logging
- **Security**: Helmet, CORS, rate limiting

#### Database Layer
- **Primary Database**: MongoDB with Mongoose ODM
- **Cache Layer**: Redis for performance optimization
- **Indexing Strategy**: Optimized indexes for frequent queries

### Data Flow

#### Booking Creation Flow
```
1. User submits booking form
2. Frontend validates input
3. API searches for available routes
4. User selects route
5. API creates booking with BOOKED status
6. Initial event added to timeline
7. Booking cached in Redis
8. Response sent to frontend
```

#### Status Update Flow
```
1. External system/admin updates status
2. Distributed lock acquired (Redis)
3. Booking retrieved from database
4. Status transition validated
5. New event added to timeline
6. Booking updated in database
7. Cache invalidated
8. Lock released
9. Response sent
```

## Low Level Design (LLD)

### Database Schema

#### Flights Collection
```javascript
{
  _id: ObjectId,
  flight_id: String (unique, indexed),
  flight_number: String,
  airline: String,
  departure: Date,
  arrival: Date,
  origin: String (3-char IATA),
  destination: String (3-char IATA),
  created_at: Date,
  updated_at: Date
}

// Indexes
{ origin: 1, destination: 1, departure: 1 } // Compound index for route queries
{ flight_id: 1 } // Unique index
```

#### Bookings Collection
```javascript
{
  _id: ObjectId,
  ref_id: String (unique, indexed), // RG12345678
  origin: String (3-char IATA),
  destination: String (3-char IATA),
  pieces: Number,
  weight_kg: Number,
  status: String (enum),
  flight_ids: [String],
  events: [{
    id: String,
    type: String,
    status: String,
    location: String,
    timestamp: Date,
    description: String,
    flight_info: {
      flight_number: String,
      airline: String
    },
    meta: Object
  }],
  created_at: Date,
  updated_at: Date
}

// Indexes
{ ref_id: 1 } // Unique index
{ status: 1 } // Status queries
{ origin: 1, destination: 1 } // Route queries
{ 'events.timestamp': -1 } // Timeline queries
{ created_at: -1 } // Recent bookings
```

#### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed),
  name: String,
  role: String (enum: 'user', 'admin'),
  created_at: Date,
  updated_at: Date
}
```

### API Layer Architecture

#### Controllers
- Handle HTTP requests/responses
- Input validation
- Error handling
- Response formatting

#### Services
- Business logic implementation
- Database operations
- External service integration
- Caching logic

#### Models
- MongoDB schema definitions
- Data validation
- Middleware hooks (password hashing, etc.)

### Caching Strategy

#### Cache Keys
```
booking:{ref_id}           # Booking details (1 hour TTL)
routes:{origin}:{dest}:{date} # Route search results (30 min TTL)
idempotency:{key}          # Idempotency cache (24 hour TTL)
lock:booking:{ref_id}      # Distributed locks (30 sec TTL)
```

#### Cache Invalidation
- Booking updates clear booking cache
- Status changes invalidate related caches
- TTL-based expiration for route searches

### Concurrency Control

#### Distributed Locking
```javascript
// Acquire lock before booking updates
const lockKey = `lock:booking:${refId}`;
const lockAcquired = await redisClient.acquireLock(lockKey, 30);

if (!lockAcquired) {
  throw new ConflictError('Booking is being updated');
}

try {
  // Perform update
  await updateBooking();
} finally {
  // Always release lock
  await redisClient.releaseLock(lockKey);
}
```

### Performance Optimizations

#### Database Optimizations
1. **Compound Indexes**: Optimized for common query patterns
2. **Projection**: Only fetch required fields
3. **Aggregation**: Use MongoDB aggregation for complex queries
4. **Connection Pooling**: Mongoose connection pooling

#### Application Optimizations
1. **Redis Caching**: Reduce database load
2. **Response Compression**: Gzip compression
3. **Request Validation**: Early validation to prevent unnecessary processing
4. **Async Operations**: Non-blocking I/O operations

#### Monitoring & Observability
1. **Request Logging**: All API requests logged
2. **Performance Metrics**: Response time tracking
3. **Error Tracking**: Structured error logging
4. **Health Checks**: System health monitoring

### Security Measures

#### Authentication & Authorization
- JWT tokens with expiration
- Password hashing with bcrypt (12 rounds)
- Protected routes with middleware

#### API Security
- Rate limiting (100 req/15min per IP)
- CORS configuration
- Helmet security headers
- Input validation and sanitization

#### Data Security
- No sensitive data in logs
- Password excluded from API responses
- Secure token generation

### Scalability Considerations

#### Horizontal Scaling
- Stateless API design
- Redis for shared state
- Load balancer ready

#### Database Scaling
- Read replicas for read-heavy operations
- Sharding strategy for large datasets
- Index optimization for performance

#### Caching Strategy
- Multi-level caching (Redis + application)
- Cache warming for popular routes
- Intelligent cache invalidation

### Error Handling Strategy

#### Error Types
1. **Validation Errors**: Input validation failures
2. **Business Logic Errors**: Invalid state transitions
3. **System Errors**: Database/Redis connection issues
4. **Authentication Errors**: Invalid/expired tokens

#### Error Response Format
- Problem JSON standard (RFC 7807)
- Consistent error structure
- Helpful error messages
- No sensitive information exposure

### Deployment Architecture

#### Development Environment
```
Frontend (Vite) → Backend (Express) → MongoDB + Redis (Docker)
```

#### Production Environment
```
Load Balancer → API Instances → Database Cluster
                    ↓
               Redis Cluster
```

### Monitoring & Alerting

#### Key Metrics
- Request rate and response times
- Error rates by endpoint
- Database query performance
- Cache hit rates
- System resource usage

#### Alerting Thresholds
- Response time > 1000ms
- Error rate > 5%
- Memory usage > 80%
- Database connection failures