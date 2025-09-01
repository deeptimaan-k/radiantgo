import { Flight, IFlight } from '../models/Flight';
import { NotFoundError } from '../utils/errors';
import { cacheService } from '../utils/cache';
import { withPerformanceLogging } from '../utils/performance';
import logger from '../utils/logger';

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  date: string;
}

export interface RouteOption {
  id: string;
  type: 'direct' | 'one_transit';
  flights: IFlight[];
  total_duration: number;
  total_cost: number;
}

export class FlightService {
  @withPerformanceLogging
  async searchFlights(query: FlightSearchQuery): Promise<IFlight[]> {
    const cacheKey = cacheService.generateRouteKey(query.origin, query.destination, query.date);
    
    // Try cache first
    const cached = await cacheService.get<IFlight[]>(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for route search: ${cacheKey}`);
      return cached;
    }

    const { origin, destination, date } = query;
    
    // Parse date and create date range for the day
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      throw new Error(`Invalid date format: ${date}`);
    }
    
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    logger.debug('Searching flights:', { origin, destination, date, startOfDay, endOfDay });

    const flights = await Flight.find({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departure: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ departure: 1 });

    logger.info(`Found ${flights.length} flights for route ${origin}-${destination} on ${date}`);
    
    // Cache results for 30 minutes
    await cacheService.set(cacheKey, flights, 1800);
    
    return flights;
  }

  @withPerformanceLogging
  async getRoutes(query: FlightSearchQuery): Promise<RouteOption[]> {
    const { origin, destination, date } = query;
    const routes: RouteOption[] = [];

    // Get direct flights
    const directFlights = await this.searchFlights(query);
    
    // Create direct route options
    directFlights.forEach(flight => {
      const duration = Math.floor((flight.arrival.getTime() - flight.departure.getTime()) / (1000 * 60));
      const cost = this.calculateFlightCost(flight, duration);
      
      routes.push({
        id: `direct-${flight.flight_id}`,
        type: 'direct',
        flights: [flight],
        total_duration: duration,
        total_cost: cost
      });
    });

    // Get one-transit routes
    const transitRoutes = await this.findTransitRoutes(origin, destination, date);
    routes.push(...transitRoutes);

    // Sort by cost
    routes.sort((a, b) => a.total_cost - b.total_cost);

    logger.info(`Found ${routes.length} total routes (${directFlights.length} direct, ${transitRoutes.length} transit)`);
    
    return routes;
  }

  private async findTransitRoutes(origin: string, destination: string, date: string): Promise<RouteOption[]> {
    const routes: RouteOption[] = [];
    const searchDate = new Date(date);
    
    if (isNaN(searchDate.getTime())) {
      logger.error(`Invalid date for transit route search: ${date}`);
      return [];
    }
    
    // Get all possible intermediate airports
    try {
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const intermediateAirports = await Flight.distinct('destination', {
        origin: origin.toUpperCase(),
        departure: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      });
      
      logger.debug(`Found ${intermediateAirports.length} intermediate airports for ${origin}`);

      for (const intermediate of intermediateAirports) {
        if (intermediate === destination.toUpperCase()) continue;

        // Find first leg flights
        const firstLegFlights = await Flight.find({
          origin: origin.toUpperCase(),
          destination: intermediate,
          departure: {
            $gte: startOfDay,
            $lt: endOfDay
          }
        }).sort({ departure: 1 });

        for (const firstFlight of firstLegFlights) {
          // Find connecting flights (same day or next day)
          const nextDay = new Date(firstFlight.arrival);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(23, 59, 59, 999);

          const secondLegFlights = await Flight.find({
            origin: intermediate,
            destination: destination.toUpperCase(),
            departure: {
              $gte: firstFlight.arrival, // Must depart after first flight arrives
              $lte: nextDay // But not later than next day
            }
          }).sort({ departure: 1 });

          for (const secondFlight of secondLegFlights) {
            // Ensure minimum connection time (1 hour)
            const connectionTime = secondFlight.departure.getTime() - firstFlight.arrival.getTime();
            if (connectionTime < 60 * 60 * 1000) continue; // Skip if less than 1 hour

            const totalDuration = Math.floor((secondFlight.arrival.getTime() - firstFlight.departure.getTime()) / (1000 * 60));
            const firstCost = this.calculateFlightCost(firstFlight, Math.floor((firstFlight.arrival.getTime() - firstFlight.departure.getTime()) / (1000 * 60)));
            const secondCost = this.calculateFlightCost(secondFlight, Math.floor((secondFlight.arrival.getTime() - secondFlight.departure.getTime()) / (1000 * 60)));
            
            routes.push({
              id: `transit-${firstFlight.flight_id}-${secondFlight.flight_id}`,
              type: 'one_transit',
              flights: [firstFlight, secondFlight],
              total_duration: totalDuration,
              total_cost: firstCost + secondCost + 50 // Add transit fee
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error finding transit routes:', error);
    }

    return routes.slice(0, 5); // Limit to 5 best transit options
  }

  private calculateFlightCost(flight: IFlight, duration: number): number {
    // Simple cost calculation based on duration and airline
    const baseCost = 100;
    const durationCost = duration * 2; // $2 per minute
    const airlineMultiplier = flight.airline.includes('Air India') ? 1.2 : 1.0;
    
    return Math.round((baseCost + durationCost) * airlineMultiplier);
  }

  async getFlightById(flightId: string): Promise<IFlight> {
    const flight = await Flight.findOne({ flight_id: flightId });
    
    if (!flight) {
      throw new NotFoundError('Flight');
    }
    
    return flight;
  }

  async getFlightsByIds(flightIds: string[]): Promise<IFlight[]> {
    const flights = await Flight.find({
      flight_id: { $in: flightIds }
    });
    
    return flights;
  }

  async createFlight(flightData: Partial<IFlight>): Promise<IFlight> {
    const flight = new Flight(flightData);
    await flight.save();
    
    logger.info(`Flight created: ${flight.flight_id}`);
    return flight;
  }
}

export const flightService = new FlightService();