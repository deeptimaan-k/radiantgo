import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Flight } from '../models/Flight';
import { generateFlightId } from '../utils/generateRef';
import logger from '../utils/logger';

dotenv.config();

const airlines = [
  'Air India', 'IndiGo', 'SpiceJet', 'Vistara', 'GoAir', 
  'AirAsia India', 'Alliance Air', 'TruJet'
];

const airports = [
  'DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD', 'AMD', 'COK', 'GOI', 'JAI',
  'LKO', 'IXR', 'IXC', 'GAU', 'IXB', 'TRV', 'IXM', 'VNS', 'IXJ', 'IXU',
  'PNQ', 'NAG', 'RPR', 'BHO', 'IDR', 'JLR', 'IXE', 'IXW', 'IXS', 'IXD'
];

const generateRandomFlight = (targetDate?: Date) => {
  const origin = airports[Math.floor(Math.random() * airports.length)];
  let destination = airports[Math.floor(Math.random() * airports.length)];
  
  // Ensure origin and destination are different
  while (destination === origin) {
    destination = airports[Math.floor(Math.random() * airports.length)];
  }

  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const flightNumber = `${airline.substring(0, 2).toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`;
  
  // Generate departure time
  let departureTime: Date;
  if (targetDate) {
    // For specific date, spread flights throughout the day
    const hour = Math.floor(Math.random() * 20) + 4; // 4 AM to 11 PM
    const minute = Math.floor(Math.random() * 60);
    departureTime = new Date(targetDate);
    departureTime.setHours(hour, minute, 0, 0);
  } else {
    // For random seeding, next 30 days
    const now = new Date();
    departureTime = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
  }
  
  // Generate arrival time (1-8 hours after departure)
  const flightDuration = (1 + Math.random() * 7) * 60 * 60 * 1000; // 1-8 hours
  const arrivalTime = new Date(departureTime.getTime() + flightDuration);

  return {
    flight_id: generateFlightId(),
    flight_number: flightNumber,
    airline,
    departure: departureTime,
    arrival: arrivalTime,
    origin,
    destination
  };
};

const generateFlightsForDate = (date: Date, count: number = 50) => {
  const flights = [];
  for (let i = 0; i < count; i++) {
    flights.push(generateRandomFlight(date));
  }
  return flights;
};

const seedFlights = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/radiantgo');
    logger.info('Connected to MongoDB for seeding');

    // Clear existing flights
    await Flight.deleteMany({});
    logger.info('Cleared existing flights');

    const allFlights = [];
    
    // Generate flights for today and next 7 days
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const dailyFlights = generateFlightsForDate(date, 60); // 60 flights per day
      allFlights.push(...dailyFlights);
      
      logger.info(`Generated ${dailyFlights.length} flights for ${date.toDateString()}`);
    }

    // Add some random flights for the next 30 days
    for (let i = 0; i < 500; i++) {
      allFlights.push(generateRandomFlight());
    }

    await Flight.insertMany(allFlights);
    logger.info(`Seeded ${allFlights.length} flights successfully`);

    // Log some sample routes
    const sampleRoutes = await Flight.aggregate([
      {
        $group: {
          _id: { origin: '$origin', destination: '$destination' },
          count: { $sum: 1 },
          flights: { $push: '$flight_number' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    logger.info('Top 10 routes by flight count:');
    sampleRoutes.forEach(route => {
      logger.info(`${route._id.origin} -> ${route._id.destination}: ${route.count} flights`);
    });

    // Log today's flights count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayFlights = await Flight.countDocuments({
      departure: { $gte: today, $lt: tomorrow }
    });

    logger.info(`Flights available for today: ${todayFlights}`);

  } catch (error) {
    logger.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

if (require.main === module) {
  seedFlights().catch(console.error);
}

export default seedFlights;