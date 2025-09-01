import { FlightService } from '../../services/flight.service';
import { Flight } from '../../models/Flight';
import { generateFlightId } from '../../utils/generateRef';
import { cacheService } from '../../utils/cache';

const flightService = new FlightService();

describe('FlightService', () => {
  let testFlightId1: string;
  let testFlightId2: string;
  let testFlightId3: string;

  beforeEach(async () => {
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

  describe('searchFlights', () => {
    it('should find direct flights for valid route and date', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const searchDate = tomorrow.toISOString().split('T')[0];

      const flights = await flightService.searchFlights({
        origin: 'DEL',
        destination: 'BOM',
        date: searchDate
      });

      expect(flights.length).toBe(1);
      expect(flights[0].flight_id).toBe(testFlightId1);
    });

    it('should return empty array for non-existent route', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const searchDate = tomorrow.toISOString().split('T')[0];

      const flights = await flightService.searchFlights({
        origin: 'BLR',
        destination: 'MAA',
        date: searchDate
      });

      expect(flights).toHaveLength(0);
    });

    it('should cache search results', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const searchDate = tomorrow.toISOString().split('T')[0];

      // First request
      const flights1 = await flightService.searchFlights({
        origin: 'DEL',
        destination: 'BOM',
        date: searchDate
      });

      // Second request should hit cache
      const flights2 = await flightService.searchFlights({
        origin: 'DEL',
        destination: 'BOM',
        date: searchDate
      });

      expect(flights1).toEqual(flights2);
    });
  });

  describe('getRoutes', () => {
    it('should return both direct and transit routes', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const searchDate = tomorrow.toISOString().split('T')[0];

      const routes = await flightService.getRoutes({
        origin: 'DEL',
        destination: 'BOM',
        date: searchDate
      });

      expect(routes.length).toBeGreaterThan(0);
      
      const directRoutes = routes.filter(r => r.type === 'direct');
      const transitRoutes = routes.filter(r => r.type === 'one_transit');
      
      expect(directRoutes.length).toBe(1);
      expect(transitRoutes.length).toBeGreaterThan(0);
      
      // Verify transit route has 2 flights
      const transitRoute = transitRoutes[0];
      expect(transitRoute.flights).toHaveLength(2);
      expect(transitRoute.flights[0].origin).toBe('DEL');
      expect(transitRoute.flights[0].destination).toBe('HYD');
      expect(transitRoute.flights[1].origin).toBe('HYD');
      expect(transitRoute.flights[1].destination).toBe('BOM');
    });

    it('should respect minimum connection time for transit routes', async () => {
      // Create flights with insufficient connection time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      
      const shortConnectionFlights = [
        {
          flight_id: generateFlightId(),
          flight_number: 'AI301',
          airline: 'Air India',
          departure: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000), // 8 AM
          arrival: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000), // 10 AM
          origin: 'DEL',
          destination: 'CCU'
        },
        {
          flight_id: generateFlightId(),
          flight_number: 'AI302',
          airline: 'Air India',
          departure: new Date(tomorrow.getTime() + 10.5 * 60 * 60 * 1000), // 10:30 AM (30 min connection)
          arrival: new Date(tomorrow.getTime() + 12.5 * 60 * 60 * 1000), // 12:30 PM
          origin: 'CCU',
          destination: 'BOM'
        }
      ];

      await Flight.insertMany(shortConnectionFlights);

      const searchDate = tomorrow.toISOString().split('T')[0];
      const routes = await flightService.getRoutes({
        origin: 'DEL',
        destination: 'BOM',
        date: searchDate
      });

      // Should not include route with insufficient connection time
      const ccuTransitRoute = routes.find(r => 
        r.type === 'one_transit' && 
        r.flights.some(f => f.origin === 'CCU')
      );
      expect(ccuTransitRoute).toBeUndefined();
    });

    it('should sort routes by cost', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const searchDate = tomorrow.toISOString().split('T')[0];

      const routes = await flightService.getRoutes({
        origin: 'DEL',
        destination: 'BOM',
        date: searchDate
      });

      // Verify routes are sorted by cost (ascending)
      for (let i = 1; i < routes.length; i++) {
        expect(routes[i].total_cost).toBeGreaterThanOrEqual(routes[i - 1].total_cost);
      }
    });

    it('should limit transit routes to 5 options', async () => {
      // Create many transit options
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      
      const manyTransitFlights = [];
      const intermediates = ['HYD', 'BLR', 'MAA', 'CCU', 'AMD', 'COK'];
      
      for (const intermediate of intermediates) {
        manyTransitFlights.push(
          {
            flight_id: generateFlightId(),
            flight_number: `AI${Math.floor(Math.random() * 900) + 100}`,
            airline: 'Air India',
            departure: new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000),
            arrival: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000),
            origin: 'DEL',
            destination: intermediate
          },
          {
            flight_id: generateFlightId(),
            flight_number: `AI${Math.floor(Math.random() * 900) + 100}`,
            airline: 'Air India',
            departure: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000),
            arrival: new Date(tomorrow.getTime() + 14 * 60 * 60 * 1000),
            origin: intermediate,
            destination: 'BOM'
          }
        );
      }

      await Flight.insertMany(manyTransitFlights);

      const searchDate = tomorrow.toISOString().split('T')[0];
      const routes = await flightService.getRoutes({
        origin: 'DEL',
        destination: 'BOM',
        date: searchDate
      });

      const transitRoutes = routes.filter(r => r.type === 'one_transit');
      expect(transitRoutes.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getFlightById', () => {
    it('should return flight by ID', async () => {
      const flight = await flightService.getFlightById(testFlightId1);
      expect(flight.flight_id).toBe(testFlightId1);
      expect(flight.flight_number).toBe('AI101');
    });

    it('should throw NotFoundError for non-existent flight', async () => {
      await expect(flightService.getFlightById('NONEXISTENT'))
        .rejects
        .toThrow('Flight not found');
    });
  });

  describe('getFlightsByIds', () => {
    it('should return multiple flights by IDs', async () => {
      const flights = await flightService.getFlightsByIds([testFlightId1, testFlightId2]);
      expect(flights).toHaveLength(2);
      expect(flights.map(f => f.flight_id)).toContain(testFlightId1);
      expect(flights.map(f => f.flight_id)).toContain(testFlightId2);
    });

    it('should return empty array for non-existent flight IDs', async () => {
      const flights = await flightService.getFlightsByIds(['NONEXISTENT1', 'NONEXISTENT2']);
      expect(flights).toHaveLength(0);
    });
  });
});