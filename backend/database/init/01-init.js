// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

print('🚀 Initializing RadiantGo database...');

// Switch to the radiantgo database
db = db.getSiblingDB('radiantgo');

// Create collections with validation
db.createCollection('flights', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['flight_number', 'airline', 'origin', 'destination', 'departure_ts', 'arrival_ts'],
      properties: {
        flight_number: {
          bsonType: 'string',
          description: 'Flight number must be a string and is required'
        },
        airline: {
          bsonType: 'string',
          description: 'Airline name must be a string and is required'
        },
        origin: {
          bsonType: 'string',
          pattern: '^[A-Z]{3}$',
          description: 'Origin must be a 3-letter airport code'
        },
        destination: {
          bsonType: 'string',
          pattern: '^[A-Z]{3}$',
          description: 'Destination must be a 3-letter airport code'
        },
        departure_ts: {
          bsonType: 'date',
          description: 'Departure timestamp must be a date'
        },
        arrival_ts: {
          bsonType: 'date',
          description: 'Arrival timestamp must be a date'
        }
      }
    }
  }
});

db.createCollection('bookings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['ref_id', 'origin', 'destination', 'pieces', 'weight_kg', 'status'],
      properties: {
        ref_id: {
          bsonType: 'string',
          description: 'Booking reference ID must be a string and is required'
        },
        origin: {
          bsonType: 'string',
          pattern: '^[A-Z]{3}$',
          description: 'Origin must be a 3-letter airport code'
        },
        destination: {
          bsonType: 'string',
          pattern: '^[A-Z]{3}$',
          description: 'Destination must be a 3-letter airport code'
        },
        pieces: {
          bsonType: 'int',
          minimum: 1,
          maximum: 1000,
          description: 'Pieces must be between 1 and 1000'
        },
        weight_kg: {
          bsonType: 'double',
          minimum: 0.1,
          maximum: 10000,
          description: 'Weight must be between 0.1 and 10000 kg'
        },
        status: {
          bsonType: 'string',
          enum: ['BOOKED', 'DEPARTED', 'ARRIVED', 'DELIVERED', 'CANCELLED'],
          description: 'Status must be one of the allowed values'
        }
      }
    }
  }
});

db.createCollection('booking_events');
db.createCollection('users');
db.createCollection('outbox');

// Create indexes for performance
print('📊 Creating database indexes...');

// Flight indexes
db.flights.createIndex({ "flight_number": 1 }, { unique: true });
db.flights.createIndex({ "origin": 1, "destination": 1, "departure_ts": 1 });
db.flights.createIndex({ "departure_ts": 1 });

// Booking indexes
db.bookings.createIndex({ "ref_id": 1 }, { unique: true });
db.bookings.createIndex({ "status": 1 });
db.bookings.createIndex({ "origin": 1, "destination": 1 });
db.bookings.createIndex({ "created_at": -1 });

// Booking event indexes
db.booking_events.createIndex({ "booking_id": 1, "at_ts": -1 });
db.booking_events.createIndex({ "type": 1, "at_ts": -1 });

// User indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

// Outbox indexes
db.outbox.createIndex({ "published_at": 1 });
db.outbox.createIndex({ "booking_id": 1, "created_at": -1 });

print('✅ RadiantGo database initialized successfully');
print('📈 Collections and indexes created');
print('🔐 Database ready for application connections');