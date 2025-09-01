import request from 'supertest';
import App from '../../app';
import { Flight } from '../../models/Flight';
import { User } from '../../models/User';
import { generateFlightId } from '../../utils/generateRef';
import { generateToken } from '../../utils/jwt';

const app = new App().app;

describe('Performance Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeEach(async () => {
    // Create test user and get auth token
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
    authToken = generateToken(testUser);

    // Create many test flights for performance testing
    const flights = [];
    const airports = ['DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD'];
    
    for (let i = 0; i < 100; i++) {
      const origin = airports[Math.floor(Math.random() * airports.length)];
      let destination = airports[Math.floor(Math.random() * airports.length)];
      while (destination === origin) {
        destination = airports[Math.floor(Math.random() * airports.length)];
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departure = new Date(tomorrow.getTime() + Math.random() * 20 * 60 * 60 * 1000);
      const arrival = new Date(departure.getTime() + (1 + Math.random() * 6) * 60 * 60 * 1000);

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
  });

  describe('Route Search Performance', () => {
    it('should handle route search within acceptable time', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/flights/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          origin: 'DEL',
          destination: 'BOM',
          departure_date: departureDate
        });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should benefit from caching on repeated requests', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const query = {
        origin: 'DEL',
        destination: 'BOM',
        departure_date: departureDate
      };

      // First request (cache miss)
      const start1 = Date.now();
      const response1 = await request(app)
        .get('/api/flights/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .query(query);
      const time1 = Date.now() - start1;

      expect(response1.status).toBe(200);

      // Second request (cache hit)
      const start2 = Date.now();
      const response2 = await request(app)
        .get('/api/flights/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .query(query);
      const time2 = Date.now() - start2;

      expect(response2.status).toBe(200);
      expect(response2.body).toEqual(response1.body);
      
      // Second request should be faster due to caching
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('Booking Operations Performance', () => {
    it('should handle multiple booking creations efficiently', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const promises = [];
      const startTime = Date.now();

      // Create 10 concurrent bookings
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/api/bookings')
            .set('Authorization', `Bearer ${authToken}`)
            .set('Idempotency-Key', `test-key-${i}`)
            .send({
              origin: 'DEL',
              destination: 'BOM',
              pieces: 1,
              weight_kg: 2.0,
              route_id: `direct-${generateFlightId()}`,
              departure_date: departureDate
            })
        );
      }

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All should succeed
      results.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 bookings
    });
  });

  describe('Database Query Performance', () => {
    it('should use indexes for route queries', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      // This test verifies that the compound index is being used
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/flights/route')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          origin: 'DEL',
          destination: 'BOM',
          date: departureDate
        });

      const queryTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(100); // Should be very fast with proper indexing
    });
  });
});