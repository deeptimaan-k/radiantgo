# RadiantGo Backend API

A comprehensive TypeScript backend for logistics and courier tracking platform.

## Features

- **Flight Management**: Search flights by route and date
- **Booking System**: Create and track shipment bookings
- **Status Tracking**: Real-time status updates with event logging
- **Redis Integration**: Caching, distributed locking, and idempotency
- **Security**: Rate limiting, CORS, Helmet security headers
- **Monitoring**: Comprehensive logging with Winston

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Start Redis and MongoDB with Docker**:
   ```bash
   npm run docker:up
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Seed the database**:
   ```bash
   npm run seed
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Option 2: Local Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install and start Redis and MongoDB locally**:
   - Redis: Follow [Redis installation guide](https://redis.io/download)
   - MongoDB: Follow [MongoDB installation guide](https://docs.mongodb.com/manual/installation/)

3. **Set up environment**:
   Update `.env` with your local MongoDB and Redis URLs.

4. **Seed the database**:
   ```bash
   npm run seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## Docker Commands

- `npm run docker:up` - Start all services (Redis + MongoDB)
- `npm run docker:down` - Stop all services
- `npm run docker:logs` - View service logs
- `npm run docker:redis` - Start only Redis
- `npm run docker:mongodb` - Start only MongoDB

## API Endpoints

### Flights
- `GET /api/flights/route?origin=DEL&destination=BOM&date=2024-01-15` - Search flights

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:ref_id` - Get booking details
- `POST /api/bookings/:id/depart` - Mark as departed
- `POST /api/bookings/:id/arrive` - Mark as arrived
- `POST /api/bookings/:id/deliver` - Mark as delivered
- `POST /api/bookings/:id/cancel` - Cancel booking

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run seed` - Seed database with sample flights

## Architecture

The application follows a layered architecture:
- **Models**: MongoDB schemas with Mongoose
- **Services**: Business logic layer
- **Controllers**: HTTP request handlers
- **Routes**: API route definitions
- **Middleware**: Cross-cutting concerns (auth, validation, logging)
- **Utils**: Shared utilities and helpers