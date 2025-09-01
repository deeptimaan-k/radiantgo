import request from 'supertest';
import App from '../app';
import { Flight } from '../models/Flight';
import { Booking, BookingStatus } from '../models/Booking';
import { generateFlightId } from '../utils/generateRef';

const app = new App().app;

describe('Booking Routes', () => {
  let testFlightId1: string;
  let testFlightId2: string;

  beforeEach(async () => {
    testFlightId1 = generateFlightId();
    testFlightId2 = generateFlightId();
    
    // Create test flights for direct route
    const directFlight = new Flight({
      flight_id: testFlightId1,
      flight_number: 'AI101',
      airline: 'Air India',
      departure: new Date('2024-01-15T10:00:00Z'),
      arrival: new Date('2024-01-15T12:30:00Z'),
      origin: 'DEL',
      destination: 'BOM'
    });

    // Create test flights for transit route
    const transitFlight1 = new Flight({
      flight_id: testFlightId2,
      flight_number: 'AI102',
      airline: 'Air India',
      departure: new Date('2024-01-15T08:00:00Z'),
      arrival: new Date('2024-01-15T10:00:00Z'),
      origin: 'DEL',
      destination: 'HYD'
    });

    const transitFlight2 = new Flight({
      flight_id: generateFlightId(),
      flight_number: 'AI103',
      airline: 'Air India',
      departure: new Date('2024-01-15T12:00:00Z'),
      arrival: new Date('2024-01-15T14:00:00Z'),
      origin: 'HYD',
      destination: 'BOM'
    });

    await Flight.insertMany([directFlight, transitFlight1, transitFlight2]);
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking with direct route', async () => {
      const bookingData = {
        origin: 'DEL',
        destination: 'BOM',
        pieces: 2,
        weight_kg: 5.5,
        route_id: `direct-${testFlightId1}`
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ref_id).toMatch(/^RG[A-Z0-9]{8}$/);
      expect(response.body.data.status).toBe(BookingStatus.BOOKED);
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0].type).toBe('BOOKING_CREATED');
    });

    it('should create a new booking with transit route', async () => {
      const bookingData = {
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 3.0,
        route_id: `transit-${testFlightId2}-${generateFlightId()}`
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flight_ids).toHaveLength(2);
    });

    it('should validate booking data', async () => {
      const invalidBookingData = {
        origin: 'INVALID',
        destination: 'BOM',
        pieces: 0,
        weight_kg: -1,
        route_id: ''
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBookingData);

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });

    it('should handle idempotency', async () => {
      const bookingData = {
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 2.0,
        route_id: `direct-${testFlightId1}`
      };

      const idempotencyKey = 'test-key-123';

      // First request
      const response1 = await request(app)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(bookingData);

      expect(response1.status).toBe(201);

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/api/bookings')
        .set('Idempotency-Key', idempotencyKey)
        .send(bookingData);

      expect(response2.status).toBe(200);
      expect(response2.body.data.ref_id).toBe(response1.body.data.ref_id);
    });
  });

  describe('GET /api/bookings/:ref_id', () => {
    let testBooking: any;

    beforeEach(async () => {
      const booking = new Booking({
        ref_id: 'RGTEST123',
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: [testFlightId1],
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
        .get(`/api/bookings/${testBooking.ref_id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ref_id).toBe(testBooking.ref_id);
      expect(response.body.data.events).toHaveLength(1);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/RGNOTFOUND');

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('NOT_FOUND');
    });
  });

  describe('Status Update Routes', () => {
    let testBooking: any;

    beforeEach(async () => {
      const booking = new Booking({
        ref_id: 'RGTEST456',
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: [testFlightId1],
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
        .send({ 
          location: 'DEL',
          flight_info: {
            flight_number: 'AI101',
            airline: 'Air India'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(BookingStatus.DEPARTED);
      expect(response.body.data.events).toHaveLength(2);
    });

    it('should update booking to ARRIVED status', async () => {
      // First depart
      await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/depart`)
        .send({ location: 'DEL' });

      // Then arrive
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/arrive`)
        .send({ location: 'BOM' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(BookingStatus.ARRIVED);
    });

    it('should prevent invalid status transitions', async () => {
      // Try to deliver without departing
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/deliver`)
        .send({ location: 'BOM' });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });

    it('should prevent cancellation after arrival', async () => {
      // Depart and arrive
      await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/depart`)
        .send({ location: 'DEL' });
      
      await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/arrive`)
        .send({ location: 'BOM' });

      // Try to cancel
      const response = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/cancel`)
        .send({ reason: 'Customer request' });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });
  });
});