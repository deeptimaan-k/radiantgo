import { Flight } from '../../models/Flight';
import { generateFlightId } from '../../utils/generateRef';

describe('Flight Model', () => {
  describe('Schema Validation', () => {
    it('should create flight with valid data', async () => {
      const flightData = {
        flight_id: generateFlightId(),
        flight_number: 'AI101',
        airline: 'Air India',
        departure: new Date('2024-01-15T10:00:00Z'),
        arrival: new Date('2024-01-15T12:30:00Z'),
        origin: 'DEL',
        destination: 'BOM'
      };

      const flight = new Flight(flightData);
      await flight.save();

      expect(flight.flight_id).toBe(flightData.flight_id);
      expect(flight.flight_number).toBe(flightData.flight_number);
      expect(flight.origin).toBe(flightData.origin);
      expect(flight.destination).toBe(flightData.destination);
    });

    it('should validate IATA codes format', async () => {
      const flight = new Flight({
        flight_id: generateFlightId(),
        flight_number: 'AI101',
        airline: 'Air India',
        departure: new Date(),
        arrival: new Date(),
        origin: 'INVALID',
        destination: 'BOM'
      });

      await expect(flight.save()).rejects.toThrow();
    });

    it('should require unique flight_id', async () => {
      const flightId = generateFlightId();

      const flight1 = new Flight({
        flight_id: flightId,
        flight_number: 'AI101',
        airline: 'Air India',
        departure: new Date(),
        arrival: new Date(),
        origin: 'DEL',
        destination: 'BOM'
      });

      await flight1.save();

      const flight2 = new Flight({
        flight_id: flightId,
        flight_number: 'AI102',
        airline: 'Air India',
        departure: new Date(),
        arrival: new Date(),
        origin: 'BOM',
        destination: 'DEL'
      });

      await expect(flight2.save()).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const flight = new Flight({});
      await expect(flight.save()).rejects.toThrow();
    });
  });

  describe('Timestamps', () => {
    it('should set created_at and updated_at automatically', async () => {
      const flight = new Flight({
        flight_id: generateFlightId(),
        flight_number: 'AI101',
        airline: 'Air India',
        departure: new Date(),
        arrival: new Date(),
        origin: 'DEL',
        destination: 'BOM'
      });

      await flight.save();
      expect(flight.created_at).toBeDefined();
      expect(flight.updated_at).toBeDefined();
    });
  });
});