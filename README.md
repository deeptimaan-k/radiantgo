# RadiantGo - Air Cargo Booking & Tracking System

A comprehensive air cargo booking and tracking platform built with React, TypeScript, Node.js, MongoDB, and Redis.

## 🚀 Features

### Core Functionality
- **Route Search**: Find direct flights and 1-transit routes between airports
- **Booking Management**: Create, track, and manage air cargo bookings
- **Real-time Tracking**: Track shipments through their complete journey
- **Status Management**: Handle booking lifecycle (BOOKED → DEPARTED → ARRIVED → DELIVERED)
- **Event Timeline**: Comprehensive chronological event tracking

### Technical Features
- **Distributed Locking**: Redis-based concurrency control for booking updates
- **Caching**: Redis caching for improved performance
- **Idempotency**: Prevent duplicate bookings with idempotency keys
- **Rate Limiting**: API protection against abuse
- **Comprehensive Logging**: Winston-based logging for debugging and monitoring
- **Input Validation**: Joi-based request validation
- **Error Handling**: Structured error responses with Problem JSON format

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
```
backend/
├── src/
│   ├── controllers/     # HTTP request handlers
│   ├── services/        # Business logic layer
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Cross-cutting concerns
│   ├── utils/           # Shared utilities
│   └── __tests__/       # Unit tests
```

### Frontend (React + TypeScript)
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── lib/                # API client and utilities
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for caching and distributed locking
- **Validation**: Joi for request validation
- **Logging**: Winston for structured logging
- **Testing**: Jest with Supertest
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📊 Data Model

### Booking
```typescript
{
  ref_id: string;           // Human-friendly unique ID (e.g., RG12345678)
  origin: string;           // 3-letter IATA code
  destination: string;      // 3-letter IATA code
  pieces: number;           // Number of cargo pieces
  weight_kg: number;        // Total weight in kilograms
  status: BookingStatus;    // Current booking status
  flight_ids: string[];    // Associated flight IDs
  events: BookingEvent[];   // Chronological event timeline
  created_at: Date;
  updated_at: Date;
}
```

### Flight
```typescript
{
  flight_id: string;        // Unique flight identifier
  flight_number: string;    // Airline flight number
  airline: string;          // Airline name
  departure: Date;          // Departure datetime
  arrival: Date;            // Arrival datetime
  origin: string;           // 3-letter IATA code
  destination: string;      // 3-letter IATA code
}
```

### Booking Event
```typescript
{
  id: string;
  type: string;             // Event type (e.g., BOOKING_CREATED, STATUS_DEPARTED)
  status: BookingStatus;    // Status at time of event
  location: string;         // Event location
  timestamp: Date;          // Event timestamp
  description: string;      // Human-readable description
  flight_info?: {           // Optional flight information
    flight_number: string;
    airline: string;
  };
  meta?: object;           // Additional metadata
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Backend Setup

1. **Start Infrastructure Services**:
   ```bash
   cd backend
   npm run docker:up
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Seed Database**:
   ```bash
   npm run seed
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📡 API Endpoints

### Flight Routes
- `GET /api/flights/routes` - Get available routes (direct + 1-transit)
- `GET /api/flights/route` - Get direct flights only
- `GET /api/flights/:flightId` - Get flight by ID

### Booking Routes
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:ref_id` - Get booking details and history
- `POST /api/bookings/:ref_id/depart` - Mark booking as departed
- `POST /api/bookings/:ref_id/arrive` - Mark booking as arrived
- `POST /api/bookings/:ref_id/deliver` - Mark booking as delivered
- `POST /api/bookings/:ref_id/cancel` - Cancel booking

## 🔧 Configuration

### Environment Variables

**Backend (.env)**:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/radiantgo
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**Frontend (.env)**:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
```

### Test Coverage
- Unit tests for services and controllers
- Integration tests for API endpoints
- Validation testing for all inputs
- Concurrency testing for booking updates

## 📈 Performance Optimizations

### Database
- **Indexing**: Optimized indexes for frequent queries
  - Compound index on `origin`, `destination`, `departure` for flight searches
  - Index on `ref_id` for booking lookups
  - Index on `status` for status-based queries
  - Index on `events.timestamp` for timeline queries

### Caching Strategy
- **Booking Cache**: 1-hour TTL for booking details
- **Idempotency Cache**: 24-hour TTL for duplicate request prevention
- **Route Cache**: Short-term caching for route search results

### Concurrency Control
- **Distributed Locking**: Redis-based locks for booking status updates
- **Optimistic Locking**: MongoDB version control for data consistency
- **Idempotency**: Prevent duplicate operations with idempotency keys

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for specific frontend origin
- **Input Validation**: Comprehensive validation with Joi
- **Security Headers**: Helmet.js for security headers
- **Error Sanitization**: Structured error responses without sensitive data

## 📊 Monitoring & Logging

### Logging Levels
- **Error**: System errors and exceptions
- **Warn**: Non-critical issues (cache failures, etc.)
- **Info**: Important business events (bookings created, status changes)
- **Debug**: Detailed debugging information

### Log Files
- `logs/error.log` - Error-level logs only
- `logs/combined.log` - All log levels
- Console output in development mode

## 🎯 Business Rules

### Route Finding
1. **Direct Routes**: Same-day flights from origin to destination
2. **Transit Routes**: Two-flight combinations with:
   - First flight on departure date
   - Second flight on same day or next day
   - Minimum 1-hour connection time
   - Maximum 5 transit options returned

### Status Transitions
- `BOOKED` → `DEPARTED` or `CANCELLED`
- `DEPARTED` → `ARRIVED` or `CANCELLED`
- `ARRIVED` → `DELIVERED` or `CANCELLED`
- `DELIVERED` → Terminal state
- `CANCELLED` → Terminal state

**Special Rules**:
- Cannot cancel after arrival
- All status changes are logged with timestamps
- Concurrent updates are handled with distributed locks

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Configure production Redis URI
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting for production load
- [ ] Set up log rotation
- [ ] Configure monitoring and alerting

## 📝 API Documentation

### Create Booking
```http
POST /api/bookings
Content-Type: application/json
Idempotency-Key: unique-key-123

{
  "origin": "DEL",
  "destination": "BOM",
  "pieces": 2,
  "weight_kg": 5.5,
  "route_id": "direct-flight123"
}
```

### Track Booking
```http
GET /api/bookings/RG12345678
```

### Update Status
```http
POST /api/bookings/RG12345678/depart
Content-Type: application/json

{
  "location": "DEL",
  "flight_info": {
    "flight_number": "AI101",
    "airline": "Air India"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.