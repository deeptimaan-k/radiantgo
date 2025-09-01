import request from 'supertest';
import App from '../../app';
import { Flight } from '../../models/Flight';
import { Booking, BookingStatus } from '../../models/Booking';
import { User } from '../../models/User';
import { generateFlightId } from '../../utils/generateRef';
import { generateToken } from '../../utils/jwt';

const app = new App().app;

describe('Concurrency Control Tests', () => {
  let authToken: string;
  let testUser: any;
  let testFlightId: string;
  let testBooking: any;

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

    // Create test booking
    const booking = new Booking({
      ref_id: 'RGCONCUR123',
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

  describe('Distributed Locking', () => {
    it('should handle concurrent status updates with locking', async () => {
      // Simulate concurrent depart requests
      const promises = [
        request(app)
          .post(`/api/bookings/${testBooking.ref_id}/depart`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ location: 'DEL' }),
        request(app)
          .post(`/api/bookings/${testBooking.ref_id}/depart`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ location: 'DEL' })
      ];

      const results = await Promise.allSettled(promises);
      
      // One should succeed, one should fail with conflict
      const responses = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);
      
      const successful = responses.filter(r => r.status === 200);
      const conflicts = responses.filter(r => r.status === 409);
      
      expect(successful.length).toBe(1);
      expect(conflicts.length).toBe(1);
      
      // Verify the successful update
      expect(successful[0].body.data.status).toBe('DEPARTED');
      expect(successful[0].body.data.events).toHaveLength(2);
    });

    it('should allow sequential status updates', async () => {
      // Sequential updates should work fine
      const departResponse = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/depart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'DEL' });

      expect(departResponse.status).toBe(200);

      const arriveResponse = await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/arrive`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'BOM' });

      expect(arriveResponse.status).toBe(200);
      expect(arriveResponse.body.data.status).toBe('ARRIVED');
    });

    it('should handle mixed concurrent operations', async () => {
      // Mix of different status updates
      const promises = [
        request(app)
          .post(`/api/bookings/${testBooking.ref_id}/depart`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ location: 'DEL' }),
        request(app)
          .post(`/api/bookings/${testBooking.ref_id}/cancel`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ reason: 'Test cancellation' })
      ];

      const results = await Promise.allSettled(promises);
      const responses = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value);
      
      // Only one should succeed due to locking
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBe(1);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache on booking updates', async () => {
      // First, get the booking to populate cache
      const getResponse1 = await request(app)
        .get(`/api/bookings/${testBooking.ref_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse1.status).toBe(200);
      expect(getResponse1.body.data.status).toBe('BOOKED');

      // Update the booking status
      await request(app)
        .post(`/api/bookings/${testBooking.ref_id}/depart`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ location: 'DEL' });

      // Get the booking again - should reflect the update
      const getResponse2 = await request(app)
        .get(`/api/bookings/${testBooking.ref_id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse2.status).toBe(200);
      expect(getResponse2.body.data.status).toBe('DEPARTED');
      expect(getResponse2.body.data.events).toHaveLength(2);
    });
  });
});