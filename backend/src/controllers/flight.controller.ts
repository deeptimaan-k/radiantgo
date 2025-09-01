import { Request, Response, NextFunction } from 'express';
import { flightService } from '../services/flight.service';
import logger from '../utils/logger';

export class FlightController {
  async getRoutes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Route search request:', req.query);
      const { origin, destination, departure_date } = req.query as {
        origin: string;
        destination: string;
        departure_date: string;
      };

      const routes = await flightService.getRoutes({ 
        origin, 
        destination, 
        date: departure_date 
      });
      
      logger.info(`Found ${routes.length} routes for ${origin} -> ${destination} on ${departure_date}`);
      
      res.json({
        success: true,
        data: routes,
        count: routes.length
      });
    } catch (error) {
      logger.error('Route search error:', error);
      next(error);
    }
  }

  async searchFlights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Flight search request:', req.query);
      const { origin, destination, date } = req.query as {
        origin: string;
        destination: string;
        date: string;
      };

      const flights = await flightService.searchFlights({ origin, destination, date });
      
      logger.info(`Found ${flights.length} direct flights for ${origin} -> ${destination} on ${date}`);
      
      res.json({
        success: true,
        data: flights,
        count: flights.length
      });
    } catch (error) {
      logger.error('Flight search error:', error);
      next(error);
    }
  }

  async getFlightById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { flightId } = req.params;
      logger.info(`Getting flight by ID: ${flightId}`);
      const flight = await flightService.getFlightById(flightId);
      
      res.json({
        success: true,
        data: flight
      });
    } catch (error) {
      logger.error('Get flight by ID error:', error);
      next(error);
    }
  }
}

export const flightController = new FlightController();