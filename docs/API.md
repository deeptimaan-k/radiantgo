# RadiantGo API Documentation

## Base URL
```
http://localhost:5000/api
```

## Error Handling
All errors follow RFC 7807 Problem Details format:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Error",
  "status": 400,
  "detail": "Origin and destination cannot be the same",
  "instance": "/api/routes",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Rate Limiting
- **Route searches**: 30 requests per minute
- **Booking creation**: 10 requests per minute
- **Status updates**: Protected by Redis locks

## Concurrency Control
All booking status updates use Redis distributed locks to prevent race conditions.

## Message Publishing
Status changes trigger RabbitMQ events for notifications and tracking.

## Endpoints

### Routes

#### GET /routes
Find direct flights and 1-hop routes with Redis caching.

**Query Parameters:**
- `origin` (required) - 3-letter airport code
- `destination` (required) - 3-letter airport code  
- `date` (required) - ISO date (YYYY-MM-DD)

**Example:**
```
GET /api/routes?origin=DEL&destination=BLR&date=2025-01-20
```

**Response:**
```json
{
  "direct": [
    {
      "type": "direct",
      "flights": [
        {
          "_id": "2",
          "flight_number": "RG002",
          "airline": "RadiantGo Airlines",
          "origin": "DEL",
          "destination": "BLR",
          "departure_ts": "2025-01-20T08:00:00Z",
          "arrival_ts": "2025-01-20T10:30:00Z"
        }
      ],
      "total_duration": 150,
      "total_distance": 1366
    }
  ],
  "oneHop": [
    {
      "type": "one-hop",
      "flights": [...],
      "connection_airport": "BOM",
      "connection_time": 120,
      "total_duration": 330,
      "total_distance": 1227
    }
  ],
  "meta": {
    "totalDirectRoutes": 1,
    "totalOneHopRoutes": 1,
    "searchTime": "2025-01-15T10:30:00Z",
    "cached": false
  }
}
```

### Flights

#### GET /flights
Get all flights or filter by route.

**Query Parameters:**
- `origin` (optional) - Origin airport code
- `destination` (optional) - Destination airport code

**Response:**
```json
[
  {
    "_id": "1",
    "flight_number": "RG001",
    "airline": "RadiantGo Airlines",
    "origin": "NYC",
    "destination": "LAX",
    "departure_ts": "2025-01-15T10:00:00Z",
    "arrival_ts": "2025-01-15T16:00:00Z",
    "created_at": "2025-01-14T08:00:00Z",
    "updated_at": "2025-01-14T08:00:00Z"
  }
]
```

#### POST /flights
Create a new flight.

**Request Body:**
```json
{
  "flight_number": "RG001",
  "airline": "RadiantGo Airlines", 
  "origin": "NYC",
  "destination": "LAX",
  "departure_ts": "2025-01-15T10:00:00Z",
  "arrival_ts": "2025-01-15T16:00:00Z"
}
```

### Bookings

#### POST /bookings
Create a new booking.

**Request Body:**
```json
{
  "origin": "DEL",
  "destination": "BLR",
  "pieces": 5,
  "weight_kg": 125.5,
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}
```

#### GET /bookings/:ref_id
Get booking details with complete event timeline.

**Response:**
```json
{
  "booking": {
    "_id": "1",
    "ref_id": "RG123ABC456",
    "origin": "DEL",
    "destination": "BLR",
    "pieces": 5,
    "weight_kg": 125.5,
    "status": "DEPARTED",
    "created_at": "2025-01-15T09:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  },
  "timeline": [
    {
      "_id": "evt1",
      "booking_id": "1",
      "type": "BOOKING_CREATED",
      "location": "DEL",
      "at_ts": "2025-01-15T09:00:00Z",
      "payload": { "initial_status": "BOOKED" }
    },
    {
      "_id": "evt2", 
      "type": "STATUS_CHANGED_DEPARTED",
      "location": "DEL Airport",
      "at_ts": "2025-01-15T10:00:00Z",
      "payload": { "previous_status": "BOOKED", "new_status": "DEPARTED" }
    }
  ],
  "meta": {
    "totalEvents": 2,
    "lastUpdated": "2025-01-15T10:00:00Z",
    "canCancel": true,
    "nextValidStatuses": ["ARRIVED", "CANCELLED"]
  }
}
```

#### POST /bookings/:ref_id/depart
Update booking status to DEPARTED.

**Request Body:**
```json
{
  "location": "DEL Airport",
  "flight_id": "flight123",
  "notes": "Cargo loaded successfully"
}
```

#### POST /bookings/:ref_id/arrive
Update booking status to ARRIVED.

**Request Body:**
```json
{
  "location": "BLR Airport",
  "notes": "Cargo arrived in good condition"
}
```

#### POST /bookings/:ref_id/deliver
Update booking status to DELIVERED.

**Request Body:**
```json
{
  "location": "Customer Warehouse",
  "notes": "Delivered to customer"
}
```

#### POST /bookings/:ref_id/cancel
Cancel booking (only allowed if status is BOOKED or DEPARTED).

**Request Body:**
```json
{
  "location": "DEL Airport",
  "notes": "Cancelled due to customer request"
}
```

### Events

#### GET /events/booking/:bookingId
Get all events for a specific booking.

**Response:**
```json
[
  {
    "_id": "1",
    "booking_id": "booking123",
    "type": "BOOKING_CREATED",
    "location": "NYC",
    "flight_id": null,
    "at_ts": "2025-01-14T09:00:00Z",
    "payload": {
      "initial_status": "BOOKED"
    },
    "created_at": "2025-01-14T09:00:00Z"
  }
]
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Status Flow

```
BOOKED → DEPARTED → ARRIVED → DELIVERED
   ↓         ↓
CANCELLED  CANCELLED
```

Valid transitions:
- From BOOKED: DEPARTED, CANCELLED
- From DEPARTED: ARRIVED, CANCELLED
- From ARRIVED: DELIVERED
- DELIVERED and CANCELLED are final states

## Caching Strategy

- **Route searches**: Cached for 5 minutes using Redis
- **Flight data**: Cached for 1 hour
- **Booking events**: Real-time, no caching

## Message Queue Events

Published to RabbitMQ exchange `booking.events`:

- `booking.created` - New booking created
- `booking.departed` - Cargo departed
- `booking.arrived` - Cargo arrived
- `booking.delivered` - Cargo delivered
- `booking.cancelled` - Booking cancelled