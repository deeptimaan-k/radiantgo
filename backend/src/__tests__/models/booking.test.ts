import { Booking, BookingStatus } from '../../models/Booking';
import { generateBookingRef } from '../../utils/generateRef';

describe('Booking Model', () => {
  describe('Schema Validation', () => {
    it('should create booking with valid data', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const bookingData = {
        ref_id: generateBookingRef(),
        origin: 'DEL',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 2,
        weight_kg: 5.5,
        flight_ids: ['flight123'],
        events: [{
          id: '1',
          type: 'BOOKING_CREATED',
          status: BookingStatus.BOOKED,
          location: 'DEL',
          timestamp: new Date(),
          description: 'Booking created'
        }]
      };

      const booking = new Booking(bookingData);
      await booking.save();

      expect(booking.ref_id).toBe(bookingData.ref_id);
      expect(booking.status).toBe(BookingStatus.BOOKED);
      expect(booking.events).toHaveLength(1);
    });

    it('should validate IATA codes', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const booking = new Booking({
        ref_id: generateBookingRef(),
        origin: 'INVALID',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: ['flight123']
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should validate positive pieces and weight', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const booking = new Booking({
        ref_id: generateBookingRef(),
        origin: 'DEL',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 0,
        weight_kg: -1,
        flight_ids: ['flight123']
      });

      await expect(booking.save()).rejects.toThrow();
    });

    it('should require unique ref_id', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const refId = generateBookingRef();

      const booking1 = new Booking({
        ref_id: refId,
        origin: 'DEL',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: ['flight123']
      });

      await booking1.save();

      const booking2 = new Booking({
        ref_id: refId,
        origin: 'BOM',
        destination: 'DEL',
        departure_date: tomorrow,
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: ['flight456']
      });

      await expect(booking2.save()).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should set default status to BOOKED', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const booking = new Booking({
        ref_id: generateBookingRef(),
        origin: 'DEL',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: ['flight123']
      });

      await booking.save();
      expect(booking.status).toBe(BookingStatus.BOOKED);
    });

    it('should set timestamps automatically', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const booking = new Booking({
        ref_id: generateBookingRef(),
        origin: 'DEL',
        destination: 'BOM',
        departure_date: tomorrow,
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: ['flight123']
      });

      await booking.save();
      expect(booking.created_at).toBeDefined();
      expect(booking.updated_at).toBeDefined();
    });
  });
});