import request from 'supertest';
import App from '../../app';
import { Flight } from '../../models/Flight';
import { Booking, BookingStatus } from '../../models/Booking';
import { User } from '../../models/User';
import { generateFlightId } from '../../utils/generateRef';
import { generateToken } from '../../utils/jwt';

const app = new App().app;

describe('Booking Controller', () => {
  let authToken: string;
  let testUser: any;
  let testFlightId: string;

  beforeEach(async () => {
    // Create test user and get auth token
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
    authToken = generateToken(testUser);

    // Create test flight
    testFlightId = generateFlightId();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testFlight = new Flight({
      flight_id: testFlightId,
      flight_number: 'AI101',
      airline: 'Air India',
      departure: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
      arrival: new Date(tomorrow.getTime() + 12.5 * 60 * 60 * 1000),
      origin: 'DEL',
      destination: 'BOM'
    });

    await testFlight.save();
  });

  describe('POST /api/bookings', () => {
    it('should create booking with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const bookingData = {
        origin: 'DEL',
        destination: 'BOM',
        pieces: 2,
        weight_kg: 5.5,
        route_id: `direct-${testFlightId}`,
        departure_date: departureDate
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ref_id).toMatch(/^RG[A-Z0-9]{8}$/);
      expect(response.body.data.status).toBe('BOOKED');
      expect(response.body.data.events).toHaveLength(1);
    });

    it('should handle idempotency correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const bookingData = {
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 2.0,
        route_id: `direct-${testFlightId}`,
        departure_date: departureDate
      };

      const idempotencyKey = 'test-key-123';

      // First request
      const response1 = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(bookingData);

      expect(response1.status).toBe(201);

      // Second request with same key
      const response2 = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(bookingData);

      expect(response2.status).toBe(200);
      expect(response2.body.data.ref_id).toBe(response1.body.data.ref_id);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });
  });

  describe('GET /api/bookings/:ref_id', () => {
    let testBooking: any;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const booking = new Booking({
        ref_id: 'RGTEST123',
        origin: 'DEL',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: [testFlightId],
        events: [{
          id: '1',
          type: 'BOOKING_CREATED',
          status: BookingStatus.BOOKED,
          location: 'DEL',
          timestamp: new Date(),
          description: 'Booking created'
        }]
      });

      testBooking = await booking.save();
    });

    it('should return booking by ref_id', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBooking.ref_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ref_id).toBe(testBooking.ref_id);
      expect(response.body.data.events).toHaveLength(1);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/RGNOTFOUND')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('NOT_FOUND');
    });
  });

  describe('Status Update Routes', () => {
    let testBooking: any;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const booking = new Booking({
        ref_id: 'RGTEST456',
        origin: 'DEL',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: [testFlightId],
        status: BookingStatus.BOOKED,
        events: [{
          id: '1',
          type: 'BOOKING_CREATED',
          status: BookingStatus.BOOKED,
          location: 'DEL',
          timestamp: new Date(),
          description: 'Booking created'
        }]
      });

      testBooking = await booking.save();
    });

    it('should update booking to DEPARTED status', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/depart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          location: 'DEL',
          flight_info: {
            flight_number: 'AI101',
            airline: 'Air India'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DEPARTED');
      expect(response.body.data.events).toHaveLength(2);
    });

    it('should update booking to ARRIVED status', async () => {
      // First depart
      await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/depart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'DEL' });

      // Then arrive
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/arrive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'BOM' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ARRIVED');
    });

    it('should prevent invalid status transitions', async () => {
      // Try to deliver without departing
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/deliver`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'BOM' });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });

    it('should prevent cancellation after arrival', async () => {
      // Depart and arrive
      await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/depart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'DEL' });
      
      await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/arrive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'BOM' });

      // Try to cancel
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Customer request' });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });

    it('should allow cancellation before arrival', async () => {
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Customer request' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all booking endpoints', async () => {
      const response = await request(app)
        .get('/api/bookings/RGTEST123');

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('UNAUTHORIZED');
    });
  });
});