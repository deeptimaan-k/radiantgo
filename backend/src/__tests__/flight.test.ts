import request from 'supertest';
import App from '../app';
import { Flight } from '../models/Flight';
import { generateFlightId } from '../utils/generateRef';

const app = new App().app;

describe('Flight Routes', () => {
  beforeEach(async () => {
    // Create test flights for direct routes
    const directFlights = [
      {
        flight_id: generateFlightId(),
        flight_number: 'AI101',
        airline: 'Air India',
        departure: new Date('2024-01-15T10:00:00Z'),
        arrival: new Date('2024-01-15T12:30:00Z'),
        origin: 'DEL',
        destination: 'BOM'
      },
      {
        flight_id: generateFlightId(),
        flight_number: 'AI102',
        airline: 'Air India',
        departure: new Date('2024-01-15T15:00:00Z'),
        arrival: new Date('2024-01-15T17:30:00Z'),
        origin: 'DEL',
        destination: 'BOM'
      }
    ];

    // Create test flights for transit routes
    const transitFlights = [
      {
        flight_id: generateFlightId(),
        flight_number: 'AI201',
        airline: 'Air India',
        departure: new Date('2024-01-15T08:00:00Z'),
        arrival: new Date('2024-01-15T10:00:00Z'),
        origin: 'DEL',
        destination: 'HYD'
      },
      {
        flight_id: generateFlightId(),
        flight_number: 'AI202',
        airline: 'Air India',
        departure: new Date('2024-01-15T12:00:00Z'),
        arrival: new Date('2024-01-15T14:00:00Z'),
        origin: 'HYD',
        destination: 'BOM'
      }
    ];

    await Flight.insertMany([...directFlights, ...transitFlights]);
  });

  describe('GET /api/flights/routes', () => {
    it('should return both direct and transit routes', async () => {
      const response = await request(app)
        .get('/api/flights/routes')
        .query({
          origin: 'DEL',
          destination: 'BOM',
          departure_date: '2024-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Should have both direct and transit routes
      const directRoutes = response.body.data.filter((r: any) => r.type === 'direct');
      const transitRoutes = response.body.data.filter((r: any) => r.type === 'one_transit');
      
      expect(directRoutes.length).toBeGreaterThan(0);
      expect(transitRoutes.length).toBeGreaterThan(0);
    });

    it('should return empty array for route with no flights', async () => {
      const response = await request(app)
        .get('/api/flights/routes')
        .query({
          origin: 'BLR',
          destination: 'MAA',
          departure_date: '2024-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    it('should validate IATA codes', async () => {
      const response = await request(app)
        .get('/api/flights/routes')
        .query({
          origin: 'INVALID',
          destination: 'BOM',
          departure_date: '2024-01-15'
        });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .get('/api/flights/routes')
        .query({
          origin: 'DEL',
          destination: 'BOM',
          departure_date: 'invalid-date'
        });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });
  });

  describe('GET /api/flights/route', () => {
    it('should return direct flights for valid route and date', async () => {
      const response = await request(app)
        .get('/api/flights/route')
        .query({
          origin: 'DEL',
          destination: 'BOM',
          date: '2024-01-15'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });
  });
});