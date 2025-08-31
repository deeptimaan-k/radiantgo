import { db } from '../database/connection.js';
import { BookingEvent } from './BookingEvent.js';
import { Booking as BookingModel } from '../database/schemas.js';
import { StatusTransitionError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const VALID_STATUSES = ['BOOKED', 'DEPARTED', 'ARRIVED', 'DELIVERED', 'CANCELLED'];
const STATUS_TRANSITIONS = {
  'BOOKED': ['DEPARTED', 'CANCELLED'],
  'DEPARTED': ['ARRIVED', 'CANCELLED'],
  'ARRIVED': ['DELIVERED'], // Note: CANCELLED not allowed after ARRIVED
  'DELIVERED': [],
  'CANCELLED': []
};

export class Booking {
  static async findAll() {
    logger.debug('Finding all bookings');
    return await db.find('bookings');
  }

  static async findById(id) {
    logger.debug(`Finding booking by ID: ${id}`);
    return await db.findOne('bookings', { _id: id });
  }

  static async findByRefId(refId) {
    logger.debug(`Finding booking by ref_id: ${refId}`);
    return await db.findOne('bookings', { ref_id: refId });
  }

  static async create(bookingData) {
    logger.info('Creating new booking', { 
      origin: bookingData.origin, 
      destination: bookingData.destination,
      pieces: bookingData.pieces,
      weight_kg: bookingData.weight_kg
    });
    
    const refId = this.generateRefId();
    logger.debug(`Generated booking reference ID: ${refId}`);
    
    // Validate origin and destination are different
    if (bookingData.origin === bookingData.destination) {
      logger.warn('Booking creation failed: origin and destination are the same', { 
        origin: bookingData.origin, 
        destination: bookingData.destination 
      });
      throw new Error('Origin and destination must be different');
    }

    // Validate pieces and weight
    if (bookingData.pieces < 1 || bookingData.pieces > 1000) {
      logger.warn('Booking creation failed: invalid pieces count', { pieces: bookingData.pieces });
      throw new Error('Pieces must be between 1 and 1000');
    }

    if (bookingData.weight_kg <= 0 || bookingData.weight_kg > 10000) {
      logger.warn('Booking creation failed: invalid weight', { weight_kg: bookingData.weight_kg });
      throw new Error('Weight must be between 0.1 and 10000 kg');
    }
    
    const booking = {
      ref_id: refId,
      origin: bookingData.origin.toUpperCase(),
      destination: bookingData.destination.toUpperCase(),
      pieces: parseInt(bookingData.pieces),
      weight_kg: parseFloat(bookingData.weight_kg),
      customer_name: bookingData.customer_name || '',
      customer_email: bookingData.customer_email || '',
      status: 'BOOKED'
    };
    
    logger.debug('Inserting booking into database', { refId, status: 'BOOKED' });
    const newBooking = await db.insert('bookings', booking);
    logger.info(`Booking created successfully: ${refId}`, { 
      bookingId: newBooking._id,
      refId: newBooking.ref_id
    });
    
    // Create booking event
    logger.debug(`Creating BOOKING_CREATED event for ${refId}`);
    await BookingEvent.create({
      booking_id: newBooking._id,
      type: 'BOOKING_CREATED',
      location: booking.origin,
      flight_id: null,
      payload: { initial_status: 'BOOKED' }
    });
    logger.debug(`BOOKING_CREATED event recorded for ${refId}`);
    
    return newBooking;
  }

  static async updateStatus(id, newStatus, eventData = {}) {
    logger.info(`Updating booking status to ${newStatus}`, { 
      bookingId: id, 
      newStatus,
      location: eventData.location 
    });
    
    const booking = await this.findById(id);
    if (!booking) {
      logger.error(`Booking not found for status update: ${id}`);
      throw new NotFoundError('Booking');
    }

    logger.debug(`Current booking status: ${booking.status} → ${newStatus}`, { 
      bookingId: id,
      refId: booking.ref_id 
    });
    
    if (!VALID_STATUSES.includes(newStatus)) {
      logger.warn(`Invalid status attempted: ${newStatus}`, { 
        bookingId: id,
        refId: booking.ref_id,
        currentStatus: booking.status 
      });
      throw new StatusTransitionError(booking.status, newStatus);
    }

    const allowedTransitions = STATUS_TRANSITIONS[booking.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      logger.warn(`Invalid status transition: ${booking.status} → ${newStatus}`, { 
        bookingId: id,
        refId: booking.ref_id,
        allowedTransitions 
      });
      throw new StatusTransitionError(booking.status, newStatus);
    }

    logger.debug(`Updating booking status in database`, { bookingId: id, newStatus });
    const updatedBooking = await db.update('bookings', { _id: id }, { status: newStatus });
    logger.info(`Booking status updated successfully: ${booking.ref_id} → ${newStatus}`, { 
      bookingId: id,
      refId: booking.ref_id,
      previousStatus: booking.status,
      newStatus
    });
    
    // Create status change event
    logger.debug(`Creating status change event: STATUS_CHANGED_${newStatus}`, { 
      bookingId: id,
      location: eventData.location 
    });
    await BookingEvent.create({
      booking_id: id,
      type: `STATUS_CHANGED_${newStatus}`,
      location: eventData.location || booking.destination,
      flight_id: eventData.flight_id || null,
      payload: { 
        previous_status: booking.status, 
        new_status: newStatus,
        notes: eventData.notes,
        ...eventData
      }
    });
    logger.debug(`Status change event recorded for ${booking.ref_id}`);
    
    return updatedBooking;
  }

  static generateRefId() {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    const refId = `RG${timestamp}${random}`;
    logger.debug(`Generated booking reference ID: ${refId}`);
    return refId;
  }

  static async deleteById(id) {
    logger.info(`Deleting booking: ${id}`);
    return await db.delete('bookings', { _id: id });
  }

  static async findByStatus(status) {
    logger.debug(`Finding bookings by status: ${status}`);
    return await db.find('bookings', { status });
  }

  static async findByRoute(origin, destination) {
    logger.debug(`Finding bookings by route: ${origin} → ${destination}`);
    return await db.find('bookings', { origin, destination });
  }
}