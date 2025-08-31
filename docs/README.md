# RadiantGo - Cargo Booking & Tracking System

A full-stack cargo booking and tracking system built with modern technologies.

## Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **TailwindCSS** for styling
- **shadcn/ui** for component library
- **React Hook Form** for form management

### Backend
- **Express.js** REST API
- **Node.js** runtime
- **CORS** and security middleware
- **Helmet** for security headers

### Database Design
- **MongoDB** with Mongoose ODM (production)
- **Redis** for caching and session management
- **RabbitMQ** for message queuing and event processing

### Infrastructure
- **Docker** containerization
- **Docker Compose** for orchestration
- **Nginx** reverse proxy for frontend

## Database Schema

### Collections

#### flights
```javascript
{
  _id: ObjectId,
  flight_number: String,    // e.g., "RG001"
  airline: String,          // e.g., "RadiantGo Airlines"
  origin: String,           // e.g., "NYC"
  destination: String,      // e.g., "LAX"
  departure_ts: Date,       // ISO timestamp
  arrival_ts: Date,         // ISO timestamp
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
- `{ origin: 1, destination: 1, departure_ts: 1 }` - Route and schedule lookup

#### bookings
```javascript
{
  _id: ObjectId,
  ref_id: String,           // Unique booking reference (e.g., "RG123ABC456")
  origin: String,           // Origin airport code
  destination: String,      // Destination airport code
  pieces: Number,           // Number of pieces
  weight_kg: Number,        // Total weight in kilograms
  status: String,           // BOOKED, DEPARTED, ARRIVED, DELIVERED, CANCELLED
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
- `{ ref_id: 1 }` - Unique index for booking reference lookup

#### booking_events
```javascript
{
  _id: ObjectId,
  booking_id: ObjectId,     // Reference to booking
  type: String,             // Event type (e.g., "STATUS_CHANGED", "LOCATION_UPDATE")
  location: String,         // Current location
  flight_id: ObjectId,      // Associated flight (optional)
  at_ts: Date,              // Event timestamp
  payload: Object,          // Additional event data
  created_at: Date
}
```

**Indexes:**
- `{ booking_id: 1, at_ts: -1 }` - Booking event timeline lookup

#### users
```javascript
{
  _id: ObjectId,
  name: String,             // Full name
  email: String,            // Email address (unique)
  role: String,             // "admin", "user", "operator"
  created_at: Date,
  updated_at: Date
}
```

**Indexes:**
- `{ email: 1 }` - Unique index for user lookup

#### outbox
```javascript
{
  _id: ObjectId,
  booking_id: ObjectId,     // Reference to booking
  event_type: String,       // Type of event to publish
  payload: Object,          // Event payload
  created_at: Date,
  published_at: Date        // null if not yet published
}
```

**Indexes:**
- `{ published_at: 1 }` - Unpublished event lookup
- `{ booking_id: 1, created_at: -1 }` - Booking event publishing order

## Status Flow

```
BOOKED → DEPARTED → ARRIVED → DELIVERED
   ↓         ↓
CANCELLED  CANCELLED
```

### Valid Status Transitions
- **BOOKED** → DEPARTED, CANCELLED
- **DEPARTED** → ARRIVED, CANCELLED  
- **ARRIVED** → DELIVERED
- **DELIVERED** → (final state)
- **CANCELLED** → (final state)

## Quick Start

### Development (WebContainer)
```bash
# Start frontend development server
cd frontend && npm run dev

# Start backend development server (in new terminal)
cd backend && npm run dev
```

### Production (Docker)
```bash
# Build and start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]
```

### Services URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017
- **Redis:** redis://localhost:6379
- **RabbitMQ Management:** http://localhost:15672 (admin/password)

## API Endpoints

### Flights
- `GET /api/flights` - List all flights
- `GET /api/flights?origin=NYC&destination=LAX` - Filter flights by route
- `POST /api/flights` - Create new flight
- `PUT /api/flights/:id` - Update flight
- `DELETE /api/flights/:id` - Delete flight

### Bookings
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `GET /api/bookings/ref/:refId` - Get booking by reference ID
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings/:id/status` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking

### Events
- `GET /api/events` - List all events
- `GET /api/events/booking/:bookingId` - Get events for booking

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Development Notes

This project demonstrates enterprise-level architecture patterns suitable for cargo tracking systems. The current implementation uses in-memory storage for WebContainer compatibility, but the structure is designed to easily integrate with the full Docker stack when deployed to a production environment.

Key architectural decisions:
- Event sourcing pattern with booking_events collection
- Outbox pattern for reliable event publishing
- Proper status state machine with validation
- RESTful API design with consistent error handling
- Modular file structure for maintainability