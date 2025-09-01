# RadiantGo API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All API endpoints (except auth endpoints) require authentication via Bearer token.

```http
Authorization: Bearer <your-jwt-token>
```

## Response Format
All responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": <response_data>,
  "count": <optional_count>
}
```

### Error Response (Problem JSON)
```json
{
  "type": "https://radiantgo.com/errors/ERROR_TYPE",
  "title": "Error Title",
  "status": 400,
  "detail": "Detailed error message",
  "instance": "/api/endpoint",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "created_at": "2024-01-15T10:30:00Z"
    },
    "token": "jwt_token_here"
  }
}
```

### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## Flight Endpoints

### Search Routes (Direct + Transit)
```http
GET /api/flights/routes?origin=DEL&destination=BOM&departure_date=2024-01-15
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "direct-flight123",
      "type": "direct",
      "flights": [
        {
          "flight_id": "flight123",
          "flight_number": "AI101",
          "airline": "Air India",
          "departure": "2024-01-15T10:00:00Z",
          "arrival": "2024-01-15T12:30:00Z",
          "origin": "DEL",
          "destination": "BOM"
        }
      ],
      "total_duration": 150,
      "total_cost": 250
    },
    {
      "id": "transit-flight456-flight789",
      "type": "one_transit",
      "flights": [
        {
          "flight_id": "flight456",
          "flight_number": "AI201",
          "airline": "Air India",
          "departure": "2024-01-15T08:00:00Z",
          "arrival": "2024-01-15T10:00:00Z",
          "origin": "DEL",
          "destination": "HYD"
        },
        {
          "flight_id": "flight789",
          "flight_number": "AI202",
          "airline": "Air India",
          "departure": "2024-01-15T12:00:00Z",
          "arrival": "2024-01-15T14:00:00Z",
          "origin": "HYD",
          "destination": "BOM"
        }
      ],
      "total_duration": 360,
      "total_cost": 350
    }
  ],
  "count": 2
}
```

### Search Direct Flights Only
```http
GET /api/flights/route?origin=DEL&destination=BOM&date=2024-01-15
Authorization: Bearer <token>
```

### Get Flight by ID
```http
GET /api/flights/:flightId
Authorization: Bearer <token>
```

## Booking Endpoints

### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
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

**Response:**
```json
{
  "success": true,
  "data": {
    "ref_id": "RG12345678",
    "origin": "DEL",
    "destination": "BOM",
    "pieces": 2,
    "weight_kg": 5.5,
    "status": "BOOKED",
    "flight_ids": ["flight123"],
    "events": [
      {
        "id": "event1",
        "type": "BOOKING_CREATED",
        "status": "BOOKED",
        "location": "DEL",
        "timestamp": "2024-01-15T10:30:00Z",
        "description": "Booking created for 2 pieces (5.5kg) from DEL to BOM"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### Get Booking by Reference ID
```http
GET /api/bookings/:ref_id
Authorization: Bearer <token>
```

### Update Booking Status

#### Mark as Departed
```http
POST /api/bookings/:ref_id/depart
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": "DEL",
  "flight_info": {
    "flight_number": "AI101",
    "airline": "Air India"
  }
}
```

#### Mark as Arrived
```http
POST /api/bookings/:ref_id/arrive
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": "BOM",
  "flight_info": {
    "flight_number": "AI101",
    "airline": "Air India"
  }
}
```

#### Mark as Delivered
```http
POST /api/bookings/:ref_id/deliver
Authorization: Bearer <token>
Content-Type: application/json

{
  "location": "BOM"
}
```

#### Cancel Booking
```http
POST /api/bookings/:ref_id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Customer request"
}
```

## Status Transitions

Valid status transitions:
- `BOOKED` → `DEPARTED` or `CANCELLED`
- `DEPARTED` → `ARRIVED` or `CANCELLED`
- `ARRIVED` → `DELIVERED` or `CANCELLED`
- `DELIVERED` → Terminal state
- `CANCELLED` → Terminal state

**Special Rules:**
- Cannot cancel after arrival
- All status changes create timeline events

## Error Codes

| Status | Type | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., concurrent updates) |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

## Rate Limiting
- 100 requests per 15 minutes per IP address
- Rate limit headers included in responses

## Idempotency
- Use `Idempotency-Key` header for booking creation
- Duplicate requests return cached response
- Keys expire after 24 hours

## Caching
- Booking details cached for 1 hour
- Route search results cached for 30 minutes
- Cache automatically invalidated on updates