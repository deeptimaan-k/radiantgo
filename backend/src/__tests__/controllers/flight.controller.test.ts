import request from 'supertest';
import App from '../../app';
import { Flight } from '../../models/Flight';
import { User } from '../../models/User';
import { generateFlightId } from '../../utils/generateRef';
import { generateToken } from '../../utils/jwt';

const app = new App().app;

describe('Flight Controller', () => {
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
        departure: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
        arrival: new Date(tomorrow.getTime() + 12.5 * 60 * 60 * 1000),
        origin: 'DEL',
        destination: 'BOM'
      },
      // Transit flights DEL -> HYD -> BOM
      {
        flight_id: testFlightId2,
        flight_number: 'AI201',
        airline: 'Air India',
        departure: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
        arrival: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
        origin: 'DEL',
        destination: 'HYD'
      },
      {
        flight_id: testFlightId3,
        flight_number: 'AI202',
        airline: 'Air India',
        departure: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000),
        arrival: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000),
        origin: 'HYD',
        destination: 'BOM'
      }
    ];

    await Flight.insertMany(testFlights);
  });

  describe('GET /api/flights/routes', () => {
    it('should return both direct and transit routes', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/flights/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          origin: 'DEL',
          destination: 'BOM',
          departure_date: departureDate
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const directRoutes = response.body.data.filter((r: any) => r.type === 'direct');
      const transitRoutes = response.body.data.filter((r: any) => r.type === 'one_transit');
      
      expect(directRoutes.length).toBeGreaterThan(0);
      expect(transitRoutes.length).toBeGreaterThan(0);
    });

    it('should validate IATA codes', async () => {
      const response = await request(app)
        .get('/api/flights/routes')
        .set('Authorization', `Bearer ${authToken}`)
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
        .set('Authorization', `Bearer ${authToken}`)
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
    it('should return direct flights only', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const departureDate = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get('/api/flights/route')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          origin: 'DEL',
          destination: 'BOM',
          date: departureDate
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].flight_id).toBe(testFlightId1);
    });
  });

  describe('GET /api/flights/:flightId', () => {
    it('should return flight by ID', async () => {
      const response = await request(app)
        .get(`/api/flights/${testFlightId1}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.flight_id).toBe(testFlightId1);
    });

    it('should return 404 for non-existent flight', async () => {
      const response = await request(app)
        .get('/api/flights/NONEXISTENT')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('NOT_FOUND');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all flight endpoints', async () => {
      const response = await request(app)
        .get('/api/flights/routes')
        .query({
          origin: 'DEL',
          destination: 'BOM',
          departure_date: '2024-01-15'
        });

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('UNAUTHORIZED');
    });
  });
});