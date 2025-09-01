import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Flight } from '../models/Flight';
import { Booking, BookingStatus } from '../models/Booking';
import { bookingService } from '../services/booking.service';
import { flightService } from '../services/flight.service';
import { generateFlightId, generateBookingRef } from '../utils/generateRef';
import logger from '../utils/logger';

dotenv.config();

interface PerformanceResults {
  operation: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
}

class PerformanceTester {
  async runTests(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/radiantgo');
      logger.info('Connected to MongoDB for performance testing');

      // Setup test data
      await this.setupTestData();

      // Run performance tests
      const results: PerformanceResults[] = [];
      
      results.push(await this.testRouteSearch());
      results.push(await this.testBookingCreation());
      results.push(await this.testBookingRetrieval());
      results.push(await this.testStatusUpdates());

      // Display results
      this.displayResults(results);

    } catch (error) {
      logger.error('Performance test error:', error);
    } finally {
      await mongoose.connection.close();
    }
  }

  private async setupTestData(): Promise<void> {
    logger.info('Setting up test data...');
    
    // Clear existing data
    await Flight.deleteMany({});
    await Booking.deleteMany({});

    // Create test flights
    const flights = [];
    const airports = ['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD'];
    
    for (let i = 0; i < 1000; i++) {
      const origin = airports[Math.floor(Math.random() * airports.length)];
      let destination = airports[Math.floor(Math.random() * airports.length)];
      while (destination === origin) {
        destination = airports[Math.floor(Math.random() * airports.length)];
      }

      const departure = new Date();
      departure.setDate(departure.getDate() + Math.floor(Math.random() * 7));
      departure.setHours(Math.floor(Math.random() * 20) + 4);

      const arrival = new Date(departure.getTime() + (2 + Math.random() * 6) * 60 * 60 * 1000);

      flights.push({
        flight_id: generateFlightId(),
        flight_number: `AI${1000 + i}`,
        airline: 'Air India',
        departure,
        arrival,
        origin,
        destination
      });
    }

    await Flight.insertMany(flights);
    logger.info(`Created ${flights.length} test flights`);
  }

  private async testRouteSearch(): Promise<PerformanceResults> {
    logger.info('Testing route search performance...');
    
    const requests = 100;
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    const startTime = Date.now();

    for (let i = 0; i < requests; i++) {
      const requestStart = Date.now();
      
      try {
        await flightService.getRoutes({
          origin: 'DEL',
          destination: 'BOM',
          date: new Date().toISOString().split('T')[0]
        });
        
        successful++;
        responseTimes.push(Date.now() - requestStart);
      } catch (error) {
        failed++;
        logger.error(`Route search request ${i} failed:`, error);
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      operation: 'Route Search',
      totalRequests: requests,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: (successful / totalTime) * 1000
    };
  }

  private async testBookingCreation(): Promise<PerformanceResults> {
    logger.info('Testing booking creation performance...');
    
    const requests = 50;
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    const startTime = Date.now();

    for (let i = 0; i < requests; i++) {
      const requestStart = Date.now();
      
      try {
        await bookingService.createBooking({
          origin: 'DEL',
          destination: 'BOM',
          pieces: Math.floor(Math.random() * 5) + 1,
          weight_kg: Math.random() * 100 + 1,
          route_id: `direct-${generateFlightId()}`
        });
        
        successful++;
        responseTimes.push(Date.now() - requestStart);
      } catch (error) {
        failed++;
        logger.error(`Booking creation request ${i} failed:`, error);
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      operation: 'Booking Creation',
      totalRequests: requests,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: (successful / totalTime) * 1000
    };
  }

  private async testBookingRetrieval(): Promise<PerformanceResults> {
    logger.info('Testing booking retrieval performance...');
    
    // Create test bookings first
    const testBookings = [];
    for (let i = 0; i < 10; i++) {
      const booking = await bookingService.createBooking({
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 5,
        route_id: `direct-${generateFlightId()}`
      });
      testBookings.push(booking.ref_id);
    }

    const requests = 100;
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    const startTime = Date.now();

    for (let i = 0; i < requests; i++) {
      const requestStart = Date.now();
      const refId = testBookings[i % testBookings.length];
      
      try {
        await bookingService.getBooking(refId);
        successful++;
        responseTimes.push(Date.now() - requestStart);
      } catch (error) {
        failed++;
        logger.error(`Booking retrieval request ${i} failed:`, error);
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      operation: 'Booking Retrieval',
      totalRequests: requests,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: (successful / totalTime) * 1000
    };
  }

  private async testStatusUpdates(): Promise<PerformanceResults> {
    logger.info('Testing status update performance...');
    
    // Create test booking
    const booking = await bookingService.createBooking({
      origin: 'DEL',
      destination: 'BOM',
      pieces: 1,
      weight_kg: 5,
      route_id: `direct-${generateFlightId()}`
    });

    const requests = 20;
    const responseTimes: number[] = [];
    let successful = 0;
    let failed = 0;

    const startTime = Date.now();

    for (let i = 0; i < requests; i++) {
      const requestStart = Date.now();
      
      try {
        // Create a new booking for each status update test
        const testBooking = await bookingService.createBooking({
          origin: 'DEL',
          destination: 'BOM',
          pieces: 1,
          weight_kg: 5,
          route_id: `direct-${generateFlightId()}`
        });

        await bookingService.departBooking(testBooking.ref_id, {
          location: 'DEL',
          flight_info: { flight_number: 'AI101', airline: 'Air India' }
        });
        
        successful++;
        responseTimes.push(Date.now() - requestStart);
      } catch (error) {
        failed++;
        logger.error(`Status update request ${i} failed:`, error);
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      operation: 'Status Updates',
      totalRequests: requests,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: (successful / totalTime) * 1000
    };
  }

  private displayResults(results: PerformanceResults[]): void {
    console.log('\n=== PERFORMANCE TEST RESULTS ===\n');
    
    results.forEach(result => {
      console.log(`${result.operation}:`);
      console.log(`  Total Requests: ${result.totalRequests}`);
      console.log(`  Successful: ${result.successfulRequests}`);
      console.log(`  Failed: ${result.failedRequests}`);
      console.log(`  Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
      console.log(`  Average Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Min Response Time: ${result.minResponseTime}ms`);
      console.log(`  Max Response Time: ${result.maxResponseTime}ms`);
      console.log(`  Requests/Second: ${result.requestsPerSecond.toFixed(2)}`);
      console.log('');
    });
  }
}

if (require.main === module) {
  const tester = new PerformanceTester();
  tester.runTests().catch(console.error);
}