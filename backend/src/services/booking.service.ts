import { Booking, IBooking, BookingStatus, IBookingEvent } from '../models/Booking';
import { flightService } from './flight.service';
import { redisClient } from '../utils/redis';
import { cacheService } from '../utils/cache';
import { withPerformanceLogging } from '../utils/performance';
import { generateBookingRef } from '../utils/generateRef';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import logger from '../utils/logger';

export interface CreateBookingRequest {
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  route_id: string;
  departure_date: string;
}

export interface StatusUpdateRequest {
  location?: string;
  flight_info?: {
    flight_number?: string;
    airline?: string;
  };
  meta?: Record<string, any>;
  reason?: string;
}

export class BookingService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly LOCK_TTL = 30; // 30 seconds

  @withPerformanceLogging
  async createBooking(bookingData: CreateBookingRequest): Promise<IBooking> {
    logger.info('Creating booking with data:', bookingData);
    
    // Extract flight IDs from route_id
    const flight_ids = this.extractFlightIdsFromRoute(bookingData.route_id);
    logger.debug('Extracted flight IDs:', flight_ids);
    
    // Validate flight IDs exist
    const flights = await flightService.getFlightsByIds(flight_ids);
    
    if (flights.length !== flight_ids.length) {
      logger.error(`Flight validation failed. Expected ${flight_ids.length} flights, found ${flights.length}`);
      throw new ValidationError('One or more flight IDs are invalid');
    }

    // Validate route consistency
    const firstFlight = flights[0];
    const lastFlight = flights[flights.length - 1];
    
    if (firstFlight.origin !== bookingData.origin.toUpperCase() || 
        lastFlight.destination !== bookingData.destination.toUpperCase()) {
      logger.error('Route consistency validation failed:', {
        expectedOrigin: bookingData.origin.toUpperCase(),
        actualOrigin: firstFlight.origin,
        expectedDestination: bookingData.destination.toUpperCase(),
        actualDestination: lastFlight.destination
      });
      throw new ValidationError('Flight route does not match booking origin/destination');
    }

    const ref_id = generateBookingRef();
    
    const initialEvent: IBookingEvent = {
      id: new Date().getTime().toString(),
      type: 'BOOKING_CREATED',
      status: BookingStatus.BOOKED,
      location: bookingData.origin.toUpperCase(),
      timestamp: new Date(),
      description: `Booking created for ${bookingData.pieces} pieces (${bookingData.weight_kg}kg) from ${bookingData.origin} to ${bookingData.destination}`,
      meta: { 
        pieces: bookingData.pieces, 
        weight_kg: bookingData.weight_kg,
        route_type: flights.length > 1 ? 'one_transit' : 'direct'
      }
    };

    const booking = new Booking({
      ref_id,
      origin: bookingData.origin.toUpperCase(),
      destination: bookingData.destination.toUpperCase(),
      departure_date: new Date(bookingData.departure_date),
      pieces: bookingData.pieces,
      weight_kg: bookingData.weight_kg,
      flight_ids,
      events: [initialEvent]
    });

    await booking.save();
    
    // Cache the new booking
    const cacheKey = cacheService.generateBookingKey(ref_id);
    await cacheService.set(cacheKey, booking, this.CACHE_TTL);
    
    logger.info(`Booking created: ${ref_id} for route ${bookingData.origin}-${bookingData.destination}`);
    return booking;
  }

  private extractFlightIdsFromRoute(routeId: string): string[] {
    logger.debug('Extracting flight IDs from route:', routeId);
    
    if (routeId.startsWith('direct-')) {
      const flightId = routeId.replace('direct-', '');
      logger.debug('Direct route flight ID:', flightId);
      return [flightId];
    } else if (routeId.startsWith('transit-')) {
      const flightPart = routeId.replace('transit-', '');
      const flightIds = flightPart.split('-');
      logger.debug('Transit route flight IDs:', flightIds);
      return flightIds;
    }
    
    logger.error('Invalid route ID format:', routeId);
    throw new ValidationError('Invalid route ID format');
  }

  async getBooking(refId: string): Promise<IBooking> {
    const cacheKey = cacheService.generateBookingKey(refId);
    
    // Try cache first
    const cached = await cacheService.get<IBooking>(cacheKey);
    if (cached) {
      return cached;
    }

    const booking = await Booking.findOne({ ref_id: refId });
    
    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Cache the result
    await cacheService.set(cacheKey, booking, this.CACHE_TTL);

    return booking;
  }

  async updateBookingStatus(
    refId: string, 
    newStatus: BookingStatus, 
    updateData: StatusUpdateRequest = {}
  ): Promise<IBooking> {
    const lockKey = `lock:booking:${refId}`;
    
    // Acquire distributed lock
    const lockAcquired = await redisClient.acquireLock(lockKey, this.LOCK_TTL);
    if (!lockAcquired) {
      throw new ConflictError('Booking is currently being updated. Please try again.');
    }

    try {
      const booking = await Booking.findOne({ ref_id: refId });
      
      if (!booking) {
        throw new NotFoundError('Booking');
      }

      // Validate status transition
      this.validateStatusTransition(booking.status, newStatus);

      // Create event
      const event: IBookingEvent = {
        id: new Date().getTime().toString(),
        type: `STATUS_${newStatus}`,
        status: newStatus,
        location: updateData.location || booking.destination,
        timestamp: new Date(),
        description: this.generateEventDescription(newStatus, updateData),
        flight_info: updateData.flight_info,
        meta: updateData.meta || {}
      };

      // Update booking
      booking.status = newStatus;
      booking.events.push(event);
      await booking.save();

      // Clear cache
      const cacheKey = cacheService.generateBookingKey(refId);
      await cacheService.del(cacheKey);

      logger.info(`Booking ${refId} status updated to ${newStatus} at ${updateData.location || 'unknown location'}`);
      return booking;
    } finally {
      // Always release the lock
      await redisClient.releaseLock(lockKey);
    }
  }

  private generateEventDescription(status: BookingStatus, updateData: StatusUpdateRequest): string {
    const location = updateData.location || 'unknown location';
    const flightInfo = updateData.flight_info;
    
    switch (status) {
      case BookingStatus.DEPARTED:
        return flightInfo 
          ? `Package departed from ${location} on flight ${flightInfo.flight_number} (${flightInfo.airline})`
          : `Package departed from ${location}`;
      case BookingStatus.ARRIVED:
        return flightInfo
          ? `Package arrived at ${location} from flight ${flightInfo.flight_number} (${flightInfo.airline})`
          : `Package arrived at ${location}`;
      case BookingStatus.DELIVERED:
        return `Package successfully delivered at ${location}`;
      case BookingStatus.CANCELLED:
        return updateData.reason 
          ? `Booking cancelled: ${updateData.reason}`
          : `Booking cancelled at ${location}`;
      default:
        return `Status updated to ${status} at ${location}`;
    }
  }

  private validateStatusTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.BOOKED]: [BookingStatus.DEPARTED, BookingStatus.CANCELLED],
      [BookingStatus.DEPARTED]: [BookingStatus.ARRIVED, BookingStatus.CANCELLED],
      [BookingStatus.ARRIVED]: [BookingStatus.DELIVERED], // Cannot cancel after arrival
      [BookingStatus.DELIVERED]: [], // Terminal state
      [BookingStatus.CANCELLED]: [] // Terminal state
    };

    const allowedTransitions = validTransitions[currentStatus];
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  async departBooking(refId: string, updateData: StatusUpdateRequest): Promise<IBooking> {
    return this.updateBookingStatus(refId, BookingStatus.DEPARTED, updateData);
  }

  async arriveBooking(refId: string, updateData: StatusUpdateRequest): Promise<IBooking> {
    return this.updateBookingStatus(refId, BookingStatus.ARRIVED, updateData);
  }

  async deliverBooking(refId: string, updateData: StatusUpdateRequest): Promise<IBooking> {
    return this.updateBookingStatus(refId, BookingStatus.DELIVERED, updateData);
  }

  async cancelBooking(refId: string, updateData: StatusUpdateRequest): Promise<IBooking> {
    return this.updateBookingStatus(refId, BookingStatus.CANCELLED, updateData);
  }

  async getAllBookings(): Promise<IBooking[]> {
    return await Booking.find({}).sort({ created_at: -1 }).limit(50);
  }
}

export const bookingService = new BookingService();