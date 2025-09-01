import { Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { cacheService } from '../utils/cache';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../utils/logger';

export class BookingController {
  async createBooking(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Creating booking:', { 
        user: req.user?.email, 
        body: req.body
      });
      
      // Handle idempotency
      const idempotencyKey = req.headers['idempotency-key'] as string;
      
      if (idempotencyKey) {
        const cacheKey = cacheService.generateIdempotencyKey(idempotencyKey);
        const cached = await cacheService.get(cacheKey);
        
        if (cached) {
          logger.debug(`Idempotency key hit: ${idempotencyKey}`);
          res.json(cached);
          return;
        }
      }

      const booking = await bookingService.createBooking(req.body);
      
      const response = {
        success: true,
        data: booking
      };

      // Store for idempotency (24 hours)
      if (idempotencyKey) {
        await cacheService.set(
          cacheService.generateIdempotencyKey(idempotencyKey),
          response,
          86400 // 24 hours
        );
      }

      res.status(201).json(response);
    } catch (error) {
      logger.error('Booking creation error:', error);
      next(error);
    }
  }

  async getBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ref_id } = req.params;
      const booking = await bookingService.getBooking(ref_id);
      
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await bookingService.getAllBookings();
      
      res.json({
        success: true,
        data: bookings,
        count: bookings.length
      });
    } catch (error) {
      next(error);
    }
  }

  async departBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ref_id } = req.params;
      const updateData = req.body;
      
      const booking = await bookingService.departBooking(ref_id, updateData);
      
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async arriveBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ref_id } = req.params;
      const updateData = req.body;
      
      const booking = await bookingService.arriveBooking(ref_id, updateData);
      
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async deliverBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ref_id } = req.params;
      const updateData = req.body;
      
      const booking = await bookingService.deliverBooking(ref_id, updateData);
      
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ref_id } = req.params;
      const updateData = req.body;
      
      const booking = await bookingService.cancelBooking(ref_id, updateData);
      
      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();