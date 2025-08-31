import { Flight, Booking, User, BookingEvent } from './schemas.js';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (only in development)
    if (process.env.NODE_ENV !== 'production') {
      await Promise.all([
        Flight.deleteMany({}),
        Booking.deleteMany({}),
        User.deleteMany({}),
        BookingEvent.deleteMany({})
      ]);
      console.log('🧹 Cleared existing data');
    }

    // Seed flights
    const flights = await Flight.insertMany([
      {
        flight_number: 'RG001',
        airline: 'RadiantGo Airlines',
        origin: 'NYC',
        destination: 'LAX',
        departure_ts: new Date('2025-01-20T10:00:00Z'),
        arrival_ts: new Date('2025-01-20T16:00:00Z')
      },
      {
        flight_number: 'RG002',
        airline: 'RadiantGo Airlines',
        origin: 'DEL',
        destination: 'BLR',
        departure_ts: new Date('2025-01-20T08:00:00Z'),
        arrival_ts: new Date('2025-01-20T10:30:00Z')
      },
      {
        flight_number: 'RG003',
        airline: 'RadiantGo Airlines',
        origin: 'DEL',
        destination: 'BOM',
        departure_ts: new Date('2025-01-20T14:00:00Z'),
        arrival_ts: new Date('2025-01-20T16:00:00Z')
      },
      {
        flight_number: 'RG004',
        airline: 'RadiantGo Airlines',
        origin: 'BOM',
        destination: 'BLR',
        departure_ts: new Date('2025-01-20T18:00:00Z'),
        arrival_ts: new Date('2025-01-20T19:30:00Z')
      },
      {
        _id: '5',
        flight_number: 'RG005',
        airline: 'RadiantGo Airlines',
        origin: 'DEL',
        destination: 'HYD',
        departure_ts: new Date('2025-01-20T12:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-20T14:00:00Z').toISOString()
      },
      {
        _id: '6',
        flight_number: 'RG006',
        airline: 'RadiantGo Airlines',
        origin: 'HYD',
        destination: 'BLR',
        departure_ts: new Date('2025-01-21T08:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-21T09:30:00Z').toISOString()
      },
      {
        flight_number: 'RG005',
        airline: 'RadiantGo Airlines',
        origin: 'BLR',
        destination: 'DEL',
        departure_ts: new Date('2025-01-21T09:00:00Z'),
        arrival_ts: new Date('2025-01-21T11:30:00Z')
      },
      {
        flight_number: 'RG006',
        airline: 'RadiantGo Airlines',
        origin: 'LAX',
        destination: 'NYC',
        departure_ts: new Date('2025-01-21T12:00:00Z'),
        arrival_ts: new Date('2025-01-21T20:00:00Z')
      }
    ]);

    // Seed users
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@radiantgo.com',
        role: 'admin'
      },
      {
        name: 'John Operator',
        email: 'operator@radiantgo.com',
        role: 'operator'
      },
      {
        name: 'Jane Customer',
        email: 'customer@example.com',
        role: 'user'
      }
    ]);

    // Seed sample bookings
    const bookings = await Booking.insertMany([
      {
        ref_id: 'RG2025SAMPLE1',
        origin: 'DEL',
        destination: 'BLR',
        pieces: 3,
        weight_kg: 45.5,
        customer_name: 'Acme Corp',
        customer_email: 'shipping@acme.com',
        status: 'BOOKED'
      },
      {
        ref_id: 'RG2025SAMPLE2',
        origin: 'NYC',
        destination: 'LAX',
        pieces: 1,
        weight_kg: 12.3,
        customer_name: 'Tech Solutions Inc',
        customer_email: 'logistics@techsolutions.com',
        status: 'DEPARTED'
      }
    ]);

    // Seed booking events
    await BookingEvent.insertMany([
      {
        booking_id: bookings[0]._id,
        type: 'BOOKING_CREATED',
        location: 'DEL',
        at_ts: new Date('2025-01-15T09:00:00Z'),
        payload: { initial_status: 'BOOKED' }
      },
      {
        booking_id: bookings[1]._id,
        type: 'BOOKING_CREATED',
        location: 'NYC',
        at_ts: new Date('2025-01-15T08:00:00Z'),
        payload: { initial_status: 'BOOKED' }
      },
      {
        booking_id: bookings[1]._id,
        type: 'STATUS_CHANGED_DEPARTED',
        location: 'NYC Airport',
        at_ts: new Date('2025-01-15T10:00:00Z'),
        payload: { 
          previous_status: 'BOOKED', 
          new_status: 'DEPARTED',
          notes: 'Cargo loaded and departed on schedule'
        }
      }
    ]);

    console.log('✅ Database seeded successfully');
    console.log(`📊 Created: ${flights.length} flights, ${users.length} users, ${bookings.length} bookings`);
    
    return {
      flights: flights.length,
      users: users.length,
      bookings: bookings.length
    };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// CLI script for manual seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  import { mongoConnection } from './mongodb.js';
  
  async function runSeed() {
    try {
      await mongoConnection.connect();
      await seedDatabase();
      await mongoConnection.disconnect();
      console.log('🎉 Seeding completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    }
  }
  
  runSeed();
}