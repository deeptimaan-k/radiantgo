import { Flight } from '../models/Flight.js';
import { cacheService } from './cacheService.js';
import { performanceService } from './performanceService.js';
import logger from '../utils/logger.js';

export class RouteService {
  static async findRoutes(origin, destination, date) {
    const cacheKey = `routes:${origin}:${destination}:${date}`;
    
    logger.debug(`Searching routes: ${origin} → ${destination} on ${date}`, { cacheKey });
    
    // Use cache service with automatic population
    const routes = await cacheService.getOrSet(
      cacheKey,
      async () => {
        return await this.computeRoutes(origin, destination, date);
      },
      'routes',
      300 // 5 minute TTL
    );

    logger.info(`📋 Cache hit for routes ${origin} → ${destination}`, { 
      cacheKey,
      directRoutes: routes.direct.length,
      oneHopRoutes: routes.oneHop.length 
    });
    
    return routes;
  }

  static async computeRoutes(origin, destination, date) {
    logger.info(`🔍 Computing routes ${origin} → ${destination} for ${date}`);
    const startTime = Date.now();
    
    // Find direct flights with optimized query
    logger.debug(`Searching direct flights from ${origin} to ${destination}`);
    const directFlights = await performanceService.optimizeQuery('flights', {
      origin,
      destination
    }, {
      sort: { departure_ts: 1 },
      limit: 50 // Reasonable limit for direct flights per day
    });
    
    const targetDate = new Date(date);
    
    const directRoutes = directFlights
      .filter(flight => {
        const flightDate = new Date(flight.departure_ts);
        return flightDate.toDateString() === targetDate.toDateString();
      })
      .map(flight => ({
        type: 'direct',
        flights: [flight],
        total_duration: this.calculateDuration(flight.departure_ts, flight.arrival_ts),
        total_distance: this.estimateDistance(origin, destination)
      }));

    logger.debug(`Found ${directRoutes.length} direct routes`);
    
    // Find 1-hop routes
    logger.debug(`Searching one-hop routes from ${origin} to ${destination}`);
    const oneHopRoutes = await this.findOneHopRoutesOptimized(origin, destination, date);
    logger.debug(`Found ${oneHopRoutes.length} one-hop routes`);
    
    const computationTime = Date.now() - startTime;
    logger.info(`Route computation completed in ${computationTime}ms`, {
      origin,
      destination,
      date,
      directRoutes: directRoutes.length,
      oneHopRoutes: oneHopRoutes.length,
      computationTimeMs: computationTime
    });
    
    const allRoutes = {
      direct: directRoutes,
      oneHop: oneHopRoutes,
      searchParams: { origin, destination, date },
      generatedAt: new Date().toISOString()
    };

    return allRoutes;
  }

  static async findOneHopRoutesOptimized(origin, destination, date) {
    logger.debug(`Finding one-hop routes: ${origin} → ${destination} on ${date}`);
    
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayAfterNext = new Date(nextDay);
    dayAfterNext.setDate(dayAfterNext.getDate() + 1);
    
    logger.debug(`Date constraints: ${targetDate.toISOString()} to ${dayAfterNext.toISOString()}`);
    
    // Optimized query for first leg flights
    logger.debug(`Searching first leg flights from ${origin}`);
    const firstLegFlights = await performanceService.optimizeQuery('flights', {
      origin,
      departure_ts: { $gte: targetDate, $lt: nextDay }
    }, {
      sort: { departure_ts: 1 },
      limit: 100 // Reasonable limit for flights per day from one airport
    });
    
    logger.debug(`Found ${firstLegFlights.length} first leg flights from ${origin}`);

    const oneHopRoutes = [];
    const connectionPromises = [];

    // Process connections in parallel for better performance
    for (const firstFlight of firstLegFlights) {
      connectionPromises.push(this.findConnectionsForFlight(firstFlight, destination, dayAfterNext));
    }

    // Wait for all connection searches to complete
    const connectionResults = await Promise.allSettled(connectionPromises);
    
    connectionResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        oneHopRoutes.push(...result.value);
      } else {
        logger.warn(`Connection search failed for flight ${firstLegFlights[index].flight_number}:`, {
          error: result.reason.message
        });
      }
    });

    logger.debug(`One-hop route search completed: found ${oneHopRoutes.length} valid routes`);
    
    // Sort by total duration and limit results
    return oneHopRoutes
      .sort((a, b) => a.total_duration - b.total_duration)
      .slice(0, 20); // Limit to top 20 one-hop routes
  }

  static async findConnectionsForFlight(firstFlight, finalDestination, dayAfterNext) {
    const connections = [];
    
    try {
      logger.debug(`Checking connections from ${firstFlight.destination} for flight ${firstFlight.flight_number}`);
      
      // Optimized query for connecting flights
      const connectingFlights = await performanceService.optimizeQuery('flights', {
        origin: firstFlight.destination,
        destination: finalDestination,
        departure_ts: { $gte: new Date(firstFlight.arrival_ts), $lt: dayAfterNext }
      }, {
        sort: { departure_ts: 1 },
        limit: 50 // Reasonable limit for connecting flights
      });
      
      logger.debug(`Found ${connectingFlights.length} potential connecting flights from ${firstFlight.destination}`);

      for (const secondFlight of connectingFlights) {
        // Ensure minimum connection time (2 hours) and same/next day constraint
        const connectionTime = new Date(secondFlight.departure_ts) - new Date(firstFlight.arrival_ts);
        const secondFlightDate = new Date(secondFlight.departure_ts);
        const isValidDay = secondFlightDate < dayAfterNext;
        const connectionHours = connectionTime / (60 * 60 * 1000);
        
        logger.debug(`Evaluating connection: ${firstFlight.flight_number} → ${secondFlight.flight_number}`, {
          connectionTimeHours: connectionHours,
          isValidDay,
          secondFlightDate: secondFlightDate.toISOString(),
          cutoffDate: dayAfterNext.toISOString()
        });
        
        if (connectionTime >= 2 * 60 * 60 * 1000 && isValidDay) {
          logger.debug(`Valid one-hop route found: ${firstFlight.flight_number} → ${secondFlight.flight_number}`, {
            connectionAirport: firstFlight.destination,
            connectionTimeMinutes: Math.round(connectionTime / (60 * 1000))
          });
          
          connections.push({
            type: 'one-hop',
            flights: [firstFlight, secondFlight],
            connection_airport: firstFlight.destination,
            connection_time: Math.round(connectionTime / (60 * 1000)), // minutes
            total_duration: this.calculateDuration(firstFlight.departure_ts, secondFlight.arrival_ts),
            total_distance: this.estimateDistance(origin, firstFlight.destination) + 
                          this.estimateDistance(firstFlight.destination, finalDestination)
          });
        } else {
          logger.debug(`Invalid connection rejected: ${firstFlight.flight_number} → ${secondFlight.flight_number}`, {
            reason: connectionTime < 2 * 60 * 60 * 1000 ? 'insufficient connection time' : 'invalid day constraint',
            connectionTimeHours,
            isValidDay
          });
        }
      }
    } catch (error) {
      logger.error(`Error finding connections for flight ${firstFlight.flight_number}:`, {
        error: error.message,
        flightNumber: firstFlight.flight_number
      });
    }

    return connections;
  }

  static calculateDuration(departureTs, arrivalTs) {
    const duration = Math.round((new Date(arrivalTs) - new Date(departureTs)) / (60 * 1000)); // minutes
    logger.debug(`Calculated duration: ${duration} minutes`, { departureTs, arrivalTs });
    return duration;
  }

  static estimateDistance(origin, destination) {
    // Simplified distance estimation (in practice, use actual airport coordinates)
    const distances = {
      'NYC-LAX': 2445, 'LAX-NYC': 2445,
      'NYC-CHI': 711, 'CHI-NYC': 711,
      'CHI-LAX': 1745, 'LAX-CHI': 1745,
      'NYC-MIA': 1090, 'MIA-NYC': 1090,
      'CHI-MIA': 1197, 'MIA-CHI': 1197,
      'LAX-MIA': 2342, 'MIA-LAX': 2342,
      'DEL-BLR': 1366, 'BLR-DEL': 1366,
      'DEL-BOM': 708, 'BOM-DEL': 708,
      'BLR-BOM': 519, 'BOM-BLR': 519,
      'DEL-HYD': 1200, 'HYD-DEL': 1200,
      'HYD-BLR': 500, 'BLR-HYD': 500
    };
    
    const distance = distances[`${origin}-${destination}`] || 1000; // Default distance
    logger.debug(`Estimated distance ${origin} → ${destination}: ${distance} km`);
    return distance;
  }
}

export const routeService = new RouteService();