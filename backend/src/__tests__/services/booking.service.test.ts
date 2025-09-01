import { BookingService } from '../../services/booking.service';
import { Flight } from '../../models/Flight';
import { Booking, BookingStatus } from '../../models/Booking';
import { generateFlightId } from '../../utils/generateRef';
import { ValidationError, NotFoundError } from '../../utils/errors';

const bookingService = new BookingService();

describe('BookingService', () => {
  let testFlightId: string;

  beforeEach(async () => {
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

  describe('createBooking', () => {
    it('should create a booking with valid data', async () => {
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

      const booking = await bookingService.createBooking(bookingData);

      expect(booking.ref_id).toMatch(/^RG[A-Z0-9]{8}$/);
      expect(booking.status).toBe(BookingStatus.BOOKED);
      expect(booking.events).toHaveLength(1);
      expect(booking.events[0].type).toBe('BOOKING_CREATED');
    });

    it('should throw error for invalid route ID', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const bookingData = {
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 2.0,
        route_id: 'direct-INVALID_FLIGHT_ID',
        departure_date: departureDate
      };

      await expect(bookingService.createBooking(bookingData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should validate route consistency', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const bookingData = {
        origin: 'BLR', // Different from flight origin
        destination: 'BOM',
        pieces: 1,
        weight_kg: 2.0,
        route_id: `direct-${testFlightId}`,
        departure_date: departureDate
      };
  });

  describe('getBooking', () => {
    it('should return booking by ref_id', async () => {
      const booking = new Booking({
        ref_id: 'RGTEST789',
        origin: 'DEL',
        destination: 'BOM',
        pieces: 1,
        weight_kg: 2.0,
        flight_ids: [testFlightId],
        events: [{
          type: 'BOOKING_CREATED',
          location: 'DEL',
          at: new Date()
        }]
      });

      await booking.save();

      const foundBooking = await bookingService.getBooking('RGTEST789');
      expect(foundBooking.ref_id).toBe('RGTEST789');
    });

    it('should throw NotFoundError for non-existent booking', async () => {
      await expect(bookingService.getBooking('RGNOTFOUND'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});