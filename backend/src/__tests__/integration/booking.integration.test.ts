import request from 'supertest';
import App from '../../app';
import { Flight } from '../../models/Flight';
import { Booking, BookingStatus } from '../../models/Booking';
import { User } from '../../models/User';
import { generateFlightId } from '../../utils/generateRef';
import { generateToken } from '../../utils/jwt';

const app = new App().app;

describe('Booking Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testFlightId1: string;
  let testFlightId2: string;
  let testFlightId3: string;

  beforeEach(async () => {
    // Create test user and get auth token
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
    authToken = generateToken(testUser);

    // Create test flights
    testFlightId1 = generateFlightId();
    testFlightId2 = generateFlightId();
    testFlightId3 = generateFlightId();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testFlights = [
      // Direct flight DEL -> BOM
      {
        flight_id: testFlightId1,
        flight_number: 'AI101',
        airline: 'Air India',
        departure: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10 AM
        arrival: new Date(tomorrow.getTime() + 12.5 * 60 * 60 * 1000), // 12:30 PM
        origin: 'DEL',
        destination: 'BOM'
      },
      // Transit flights DEL -> HYD -> BOM
      {
        flight_id: testFlightId2,
        flight_number: 'AI201',
        airline: 'Air India',
        departure: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000), // 8 AM
        arrival: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10 AM
        origin: 'DEL',
        destination: 'HYD'
      },
      {
        flight_id: testFlightId3,
        flight_number: 'AI202',
        airline: 'Air India',
        departure: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000), // 12 PM
        arrival: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000), // 2 PM
        origin: 'HYD',
        destination: 'BOM'
      }
    ];

    await Flight.insertMany(testFlights);
  });

  describe('Complete Booking Workflow', () => {
    it('should complete full booking lifecycle with direct route', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      // 1. Search routes
      const routesResponse = await request(app)
        .get('/api/flights/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          origin: 'DEL', 
          destination: 'BOM', 
          departure_date: departureDate 
        });

      expect(routesResponse.status).toBe(200);
      expect(routesResponse.body.success).toBe(true);
      const routes = routesResponse.body.data;
      expect(routes.length).toBeGreaterThan(0);

      const directRoute = routes.find((r: any) => r.type === 'direct');
      expect(directRoute).toBeDefined();

      // 2. Create booking
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'DEL',
          destination: 'BOM',
          pieces: 2,
          weight_kg: 5.5,
          route_id: directRoute.id,
          departure_date: departureDate
        });

      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body.success).toBe(true);
      const booking = bookingResponse.body.data;
      expect(booking.ref_id).toMatch(/^RG[A-Z0-9]{8}$/);
      expect(booking.status).toBe('BOOKED');
      expect(booking.events).toHaveLength(1);

      // 3. Update status to departed
      const departResponse = await request(app)
        .post(`/api/bookings/${booking.ref_id}/depart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          location: 'DEL',
          flight_info: {
            flight_number: 'AI101',
            airline: 'Air India'
          }
        });

      expect(departResponse.status).toBe(200);
      expect(departResponse.body.data.status).toBe('DEPARTED');
      expect(departResponse.body.data.events).toHaveLength(2);

      // 4. Update status to arrived
      const arriveResponse = await request(app)
        .post(`/api/bookings/${booking.ref_id}/arrive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          location: 'BOM',
          flight_info: {
            flight_number: 'AI101',
            airline: 'Air India'
          }
        });

      expect(arriveResponse.status).toBe(200);
      expect(arriveResponse.body.data.status).toBe('ARRIVED');
      expect(arriveResponse.body.data.events).toHaveLength(3);

      // 5. Track booking
      const trackResponse = await request(app)
        .get(`/api/bookings/${booking.ref_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(trackResponse.status).toBe(200);
      expect(trackResponse.body.data.events).toHaveLength(3);
      
      // Events should be in chronological order
      const events = trackResponse.body.data.events;
      expect(events[0].type).toBe('BOOKING_CREATED');
      expect(events[1].type).toBe('STATUS_DEPARTED');
      expect(events[2].type).toBe('STATUS_ARRIVED');

      // 6. Try to cancel after arrival (should fail)
      const cancelResponse = await request(app)
        .post(`/api/bookings/${booking.ref_id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Customer request' });

      expect(cancelResponse.status).toBe(400);
      expect(cancelResponse.body.type).toContain('VALIDATION_ERROR');
    });

    it('should handle transit routes correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      // Search routes
      const routesResponse = await request(app)
        .get('/api/flights/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          origin: 'DEL', 
          destination: 'BOM', 
          departure_date: departureDate 
        });

      const routes = routesResponse.body.data;
      const transitRoute = routes.find((r: any) => r.type === 'one_transit');
      expect(transitRoute).toBeDefined();
      expect(transitRoute.flights).toHaveLength(2);

      // Create booking with transit route
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'DEL',
          destination: 'BOM',
          pieces: 1,
          weight_kg: 3.0,
          route_id: transitRoute.id,
          departure_date: departureDate
        });

      expect(bookingResponse.status).toBe(201);
      expect(bookingResponse.body.data.flight_ids).toHaveLength(2);
    });

    it('should prevent invalid status transitions', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      // Create booking
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'DEL',
          destination: 'BOM',
          pieces: 1,
          weight_kg: 2.0,
          route_id: `direct-${testFlightId1}`,
          departure_date: departureDate
        });

      const booking = bookingResponse.body.data;

      // Try to deliver without departing (should fail)
      const deliverResponse = await request(app)
        .post(`/api/bookings/${booking.ref_id}/deliver`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'BOM' });

      expect(deliverResponse.status).toBe(400);
      expect(deliverResponse.body.type).toContain('VALIDATION_ERROR');
    });
  });

  describe('Concurrency Control', () => {
    it('should handle concurrent booking updates with distributed locking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      // Create booking
      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          origin: 'DEL',
          destination: 'BOM',
          pieces: 1,
          weight_kg: 2.0,
          route_id: `direct-${testFlightId1}`,
          departure_date: departureDate
        });

      const booking = bookingResponse.body.data;

      // Simulate concurrent updates
      const promises = [
        request(app)
          .post(`/api/bookings/${booking.ref_id}/depart`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ location: 'DEL' }),
        request(app)
          .post(`/api/bookings/${booking.ref_id}/depart`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ location: 'DEL' })
      ];

      const results = await Promise.allSettled(promises);
      
      // One should succeed, one should fail with conflict
      const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 200);
      const failed = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 409);
      
      expect(successful.length).toBe(1);
      expect(failed.length).toBe(1);
    });
  });
});