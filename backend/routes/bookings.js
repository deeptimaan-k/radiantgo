import express from 'express';
import logger from '../utils/logger.js';
import { Booking } from '../models/Booking.js';
import { Outbox } from '../models/Outbox.js';
import { BookingEvent } from '../models/BookingEvent.js';
import { validate, validateQuery, schemas } from '../middleware/validation.js';
import { withDistributedLock, lockKeys } from '../middleware/distributedLock.js';
import { cacheService } from '../services/cacheService.js';
import { performanceService } from '../services/performanceService.js';
import { messageService } from '../services/messageService.js';
import { NotFoundError, StatusTransitionError } from '../middleware/errorHandler.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting
const bookingLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Increased for high volume: 50 bookings per minute per IP
  message: {
    type: 'https://tools.ietf.org/html/rfc6585#section-4',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Rate limit exceeded. Maximum 50 booking requests per minute.',
    retryAfter: 60
  }
});

// Status update rate limiting (higher limit for updates)
const statusUpdateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // 200 status updates per minute per IP
  message: {
    type: 'https://tools.ietf.org/html/rfc6585#section-4',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Rate limit exceeded. Maximum 200 status updates per minute.',
    retryAfter: 60
  }
});

// Add performance tracking middleware
router.use(performanceService.trackRequest.bind(performanceService));

// GET /api/bookings - Get all bookings
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, origin, destination } = req.query;
    const offset = (page - 1) * limit;
    
    logger.info('Fetching bookings with pagination', { 
      requestId: req.id,
      page,
      limit,
      filters: { status, origin, destination }
    });

    // Build cache key for pagination
    const cacheKey = `bookings:page:${page}:limit:${limit}:status:${status || 'all'}:route:${origin || 'all'}-${destination || 'all'}`;
    
    // Try cache first for read operations
    const cachedBookings = await cacheService.get(cacheKey, 'bookings');
    if (cachedBookings) {
      logger.debug(`Cache hit for bookings query: ${cacheKey}`);
      return res.json(cachedBookings);
    }

    // Build query filters
    const filters = {};
    if (status) filters.status = status;
    if (origin) filters.origin = origin;
    if (destination) filters.destination = destination;

    const bookings = await performanceService.optimizeQuery('bookings', filters, {
      limit: parseInt(limit),
      skip: offset,
      sort: { created_at: -1 }
    });

    // Get total count for pagination
    const totalBookings = await Booking.findAll(); // This should be optimized with count query
    const totalCount = totalBookings.filter(b => {
      return Object.entries(filters).every(([key, value]) => b[key] === value);
    }).length;

    const response = {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      meta: {
        filters,
        timestamp: new Date().toISOString()
      }
    };

    // Cache the response for 1 minute
    await cacheService.set(cacheKey, response, 'bookings', 60);
    
    logger.info(`Retrieved ${bookings.length} bookings (page ${page}/${Math.ceil(totalCount / limit)})`, { 
      requestId: req.id,
      totalCount,
      cached: false
    });
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching bookings:', { 
      error: error.message, 
      requestId: req.id,
      query: req.query 
    });
    next(error);
  }
});

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    logger.info(`Fetching booking by ID: ${req.params.id}`, { requestId: req.id });
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      logger.warn(`Booking not found with ID: ${req.params.id}`, { requestId: req.id });
      return res.status(404).json({ error: 'Booking not found' });
    }
    logger.info(`Retrieved booking: ${booking.ref_id}`, { requestId: req.id });
    res.json(booking);
  } catch (error) {
    logger.error('Error fetching booking by ID:', { error: error.message, bookingId: req.params.id, requestId: req.id });
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/:ref_id - Get booking by reference ID with event timeline
router.get('/:ref_id', async (req, res) => {
  try {
    const cacheKey = `booking:details:${req.params.ref_id}`;
    
    // Check cache first
    const cachedDetails = await cacheService.get(cacheKey, 'bookings');
    if (cachedDetails) {
      logger.debug(`Cache hit for booking details: ${req.params.ref_id}`);
      return res.json(cachedDetails);
    }

    logger.info(`Fetching booking history for ref_id: ${req.params.ref_id}`, { requestId: req.id });
    const booking = await Booking.findByRefId(req.params.ref_id);
    if (!booking) {
      logger.warn(`Booking not found with ref_id: ${req.params.ref_id}`, { requestId: req.id });
      return res.status(404).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
        title: 'Booking Not Found',
        status: 404,
        detail: `No booking found with reference ID: ${req.params.ref_id}`,
        instance: req.originalUrl
      });
    }
    
    // Get event timeline
    logger.debug(`Fetching event timeline for booking: ${booking._id}`, { requestId: req.id });
    const events = await BookingEvent.findByBookingId(booking._id);
    logger.info(`Retrieved ${events.length} events for booking ${booking.ref_id}`, { requestId: req.id });
    
    const response = {
      booking,
      timeline: events.sort((a, b) => new Date(a.at_ts) - new Date(b.at_ts)),
      meta: {
        totalEvents: events.length,
        lastUpdated: booking.updated_at,
        canCancel: ['BOOKED', 'DEPARTED'].includes(booking.status),
        nextValidStatuses: getNextValidStatuses(booking.status),
        cached: false
      }
    };
    
    // Cache booking details for 30 seconds (short TTL due to frequent updates)
    await cacheService.set(cacheKey, response, 'bookings', 30);
    
    res.json(response);
  } catch (error) {
    logger.error('Error fetching booking history:', { 
      error: error.message, 
      refId: req.params.ref_id, 
      requestId: req.id 
    });
    res.status(500).json({
      type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Unable to retrieve booking details',
      instance: req.originalUrl
    });
  }
});

// POST /api/bookings - Create new booking
router.post('/', 
  bookingLimit,
  validate(schemas.createBooking),
  async (req, res, next) => {
  try {
    logger.info('Creating new booking', { 
      requestId: req.id, 
      origin: req.validatedBody.origin, 
      destination: req.validatedBody.destination,
      pieces: req.validatedBody.pieces,
      weight_kg: req.validatedBody.weight_kg
    });
    
    const bookingData = req.validatedBody;

    const booking = await Booking.create(bookingData);
    logger.info(`Booking created successfully: ${booking.ref_id}`, { 
      requestId: req.id, 
      bookingId: booking._id,
      refId: booking.ref_id
    });
    
    // Publish booking created event
    logger.debug(`Publishing BOOKING_CREATED event for ${booking.ref_id}`, { requestId: req.id });
    await messageService.publishBookingEvent('BOOKING_CREATED', booking);
    
    // Add to outbox
    logger.debug(`Adding BOOKING_CREATED to outbox for ${booking.ref_id}`, { requestId: req.id });
    await Outbox.create({
      booking_id: booking._id,
      event_type: 'BOOKING_CREATED',
      payload: { booking_ref: booking.ref_id, ...bookingData }
    });
    
    res.status(201).json(booking);
  } catch (error) {
    logger.error('Error creating booking:', { 
      error: error.message, 
      requestBody: req.validatedBody,
      requestId: req.id 
    });
    next(error);
  }
});

// POST /api/bookings/:ref_id/depart - Update status to DEPARTED
router.post('/:ref_id/depart',
  statusUpdateLimit,
  withDistributedLock(lockKeys.bookingByRef, 30),
  validate(schemas.statusUpdate),
  async (req, res, next) => {
    try {
      logger.info(`Attempting to depart booking: ${req.params.ref_id}`, { 
        requestId: req.id,
        location: req.validatedBody.location 
      });
      
      const booking = await Booking.findByRefId(req.params.ref_id);
      if (!booking) {
        logger.warn(`Booking not found for departure: ${req.params.ref_id}`, { requestId: req.id });
        throw new NotFoundError('Booking');
      }

      logger.debug(`Current booking status: ${booking.status}`, { 
        requestId: req.id, 
        bookingId: booking._id 
      });
      
      const updatedBooking = await Booking.updateStatus(
        booking._id, 
        'DEPARTED', 
        req.validatedBody
      );
      
      logger.info(`Booking departed successfully: ${booking.ref_id}`, { 
        requestId: req.id,
        bookingId: booking._id,
        location: req.validatedBody.location,
        previousStatus: booking.status
      });
      
      logger.debug(`Publishing STATUS_DEPARTED event for ${booking.ref_id}`, { requestId: req.id });
      await messageService.publishBookingEvent('STATUS_DEPARTED', updatedBooking, req.validatedBody);
      
      // Invalidate related caches
      await invalidateBookingCaches(booking.ref_id, booking._id);
      
      res.json({
        booking: updatedBooking,
        message: 'Booking status updated to DEPARTED'
      });
    } catch (error) {
      logger.error('Error departing booking:', { 
        error: error.message, 
        refId: req.params.ref_id,
        requestId: req.id 
      });
      next(error);
    }
  }
);

// POST /api/bookings/:ref_id/arrive - Update status to ARRIVED
router.post('/:ref_id/arrive',
  statusUpdateLimit,
  withDistributedLock(lockKeys.bookingByRef, 30),
  validate(schemas.statusUpdate),
  async (req, res, next) => {
    try {
      logger.info(`Attempting to arrive booking: ${req.params.ref_id}`, { 
        requestId: req.id,
        location: req.validatedBody.location 
      });
      
      const booking = await Booking.findByRefId(req.params.ref_id);
      if (!booking) {
        logger.warn(`Booking not found for arrival: ${req.params.ref_id}`, { requestId: req.id });
        throw new NotFoundError('Booking');
      }

      logger.debug(`Current booking status: ${booking.status}`, { 
        requestId: req.id, 
        bookingId: booking._id 
      });
      
      const updatedBooking = await Booking.updateStatus(
        booking._id, 
        'ARRIVED', 
        req.validatedBody
      );
      
      logger.info(`Booking arrived successfully: ${booking.ref_id}`, { 
        requestId: req.id,
        bookingId: booking._id,
        location: req.validatedBody.location,
        previousStatus: booking.status
      });
      
      logger.debug(`Publishing STATUS_ARRIVED event for ${booking.ref_id}`, { requestId: req.id });
      await messageService.publishBookingEvent('STATUS_ARRIVED', updatedBooking, req.validatedBody);
      
      // Invalidate related caches
      await invalidateBookingCaches(booking.ref_id, booking._id);
      
      res.json({
        booking: updatedBooking,
        message: 'Booking status updated to ARRIVED'
      });
    } catch (error) {
      logger.error('Error arriving booking:', { 
        error: error.message, 
        refId: req.params.ref_id,
        requestId: req.id 
      });
      next(error);
    }
  }
);

// POST /api/bookings/:ref_id/deliver - Update status to DELIVERED
router.post('/:ref_id/deliver',
  statusUpdateLimit,
  withDistributedLock(lockKeys.bookingByRef, 30),
  validate(schemas.statusUpdate),
  async (req, res, next) => {
    try {
      logger.info(`Attempting to deliver booking: ${req.params.ref_id}`, { 
        requestId: req.id,
        location: req.validatedBody.location 
      });
      
      const booking = await Booking.findByRefId(req.params.ref_id);
      if (!booking) {
        logger.warn(`Booking not found for delivery: ${req.params.ref_id}`, { requestId: req.id });
        throw new NotFoundError('Booking');
      }

      logger.debug(`Current booking status: ${booking.status}`, { 
        requestId: req.id, 
        bookingId: booking._id 
      });
      
      const updatedBooking = await Booking.updateStatus(
        booking._id, 
        'DELIVERED', 
        req.validatedBody
      );
      
      logger.info(`Booking delivered successfully: ${booking.ref_id}`, { 
        requestId: req.id,
        bookingId: booking._id,
        location: req.validatedBody.location,
        previousStatus: booking.status
      });
      
      logger.debug(`Publishing STATUS_DELIVERED event for ${booking.ref_id}`, { requestId: req.id });
      await messageService.publishBookingEvent('STATUS_DELIVERED', updatedBooking, req.validatedBody);
      
      // Invalidate related caches
      await invalidateBookingCaches(booking.ref_id, booking._id);
      
      res.json({
        booking: updatedBooking,
        message: 'Booking status updated to DELIVERED'
      });
    } catch (error) {
      logger.error('Error delivering booking:', { 
        error: error.message, 
        refId: req.params.ref_id,
        requestId: req.id 
      });
      next(error);
    }
  }
);

// POST /api/bookings/:ref_id/cancel - Cancel booking (only if status < ARRIVED)
router.post('/:ref_id/cancel',
  statusUpdateLimit,
  withDistributedLock(lockKeys.bookingByRef, 30),
  validate(schemas.statusUpdate),
  async (req, res, next) => {
    try {
      logger.info(`Attempting to cancel booking: ${req.params.ref_id}`, { 
        requestId: req.id,
        reason: req.validatedBody.notes 
      });
      
      const booking = await Booking.findByRefId(req.params.ref_id);
      if (!booking) {
        logger.warn(`Booking not found for cancellation: ${req.params.ref_id}`, { requestId: req.id });
        return res.status(404).json({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.4',
          title: 'Booking Not Found',
          status: 404,
          detail: `No booking found with reference ID: ${req.params.ref_id}`,
          instance: req.originalUrl
        });
      }

      // Validate cancellation is allowed - cannot cancel once arrived
      if (['ARRIVED', 'DELIVERED', 'CANCELLED'].includes(booking.status)) {
        logger.warn(`Invalid cancellation attempt for booking ${booking.ref_id} with status ${booking.status}`, { 
          requestId: req.id,
          currentStatus: booking.status 
        });
        return res.status(422).json({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.3',
          title: 'Invalid Status Transition',
          status: 422,
          detail: `Cannot cancel booking that has status: ${booking.status}. Bookings can only be cancelled before arrival.`,
          instance: req.originalUrl
        });
      }

      logger.debug(`Cancelling booking ${booking.ref_id} from status ${booking.status}`, { requestId: req.id });
      const updatedBooking = await Booking.updateStatus(
        booking._id, 
        'CANCELLED', 
        req.validatedBody
      );
      
      logger.info(`Booking cancelled successfully: ${booking.ref_id}`, { 
        requestId: req.id,
        bookingId: booking._id,
        previousStatus: booking.status,
        reason: req.validatedBody.notes
      });
      
      logger.debug(`Publishing STATUS_CANCELLED event for ${booking.ref_id}`, { requestId: req.id });
      await messageService.publishBookingEvent('STATUS_CANCELLED', updatedBooking, req.validatedBody);
      
      // Invalidate related caches
      await invalidateBookingCaches(booking.ref_id, booking._id);
      
      res.json({
        booking: updatedBooking,
        message: 'Booking has been cancelled'
      });
    } catch (error) {
      logger.error('Error cancelling booking:', { 
        error: error.message, 
        refId: req.params.ref_id,
        requestId: req.id 
      });
      next(error);
    }
  }
);

// Helper function to invalidate booking-related caches
async function invalidateBookingCaches(refId, bookingId) {
  try {
    logger.debug(`Invalidating caches for booking: ${refId}`);
    
    // Invalidate specific booking cache
    await cacheService.invalidate(`booking:details:${refId}`);
    
    // Invalidate booking list caches (all pages and filters)
    await cacheService.invalidate('bookings:page:*');
    
    // Invalidate related route caches if needed
    await cacheService.invalidate('routes:*');
    
    logger.debug(`Cache invalidation completed for booking: ${refId}`);
  } catch (error) {
    logger.error('Cache invalidation error:', { 
      error: error.message,
      refId,
      bookingId 
    });
  }
}

// Helper function to get next valid statuses
function getNextValidStatuses(currentStatus) {
  const transitions = {
    'BOOKED': ['DEPARTED', 'CANCELLED'],
    'DEPARTED': ['ARRIVED', 'CANCELLED'],
    'ARRIVED': ['DELIVERED'],
    'DELIVERED': [],
    'CANCELLED': []
  };
  return transitions[currentStatus] || [];
}

// DELETE /api/bookings/:id - Delete booking
router.delete('/:id', async (req, res) => {
  try {
    logger.info(`Attempting to delete booking: ${req.params.id}`, { requestId: req.id });
    const booking = await Booking.deleteById(req.params.id);
    if (!booking) {
      logger.warn(`Booking not found for deletion: ${req.params.id}`, { requestId: req.id });
      return res.status(404).json({ error: 'Booking not found' });
    }
    logger.info(`Booking deleted successfully: ${booking.ref_id}`, { 
      requestId: req.id,
      deletedBookingId: req.params.id 
    });
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    logger.error('Error deleting booking:', { 
      error: error.message, 
      bookingId: req.params.id,
      requestId: req.id 
    });
    res.status(500).json({ error: error.message });
  }
});

export { router as bookingRoutes };