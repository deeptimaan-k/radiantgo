import { db } from '../database/connection.js';
import { BookingEvent as BookingEventModel } from '../database/schemas.js';
import logger from '../utils/logger.js';

export class BookingEvent {
  static async findAll() {
    logger.debug('Finding all booking events');
    return await db.find('booking_events');
  }

  static async findByBookingId(bookingId) {
    logger.debug(`Finding events for booking: ${bookingId}`);
    return await db.find('booking_events', { booking_id: bookingId });
  }

  static async create(eventData) {
    logger.info(`Creating booking event: ${eventData.type}`, { 
      bookingId: eventData.booking_id,
      type: eventData.type,
      location: eventData.location 
    });
    
    const event = {
      booking_id: eventData.booking_id,
      type: eventData.type,
      location: eventData.location,
      flight_id: eventData.flight_id,
      at_ts: new Date().toISOString(),
      payload: eventData.payload || {}
    };
    
    logger.debug('Inserting event into database', { 
      eventType: event.type,
      bookingId: event.booking_id 
    });
    
    return await db.insert('booking_events', event);
  }

  static async findById(id) {
    logger.debug(`Finding event by ID: ${id}`);
    return await db.findOne('booking_events', { _id: id });
  }

  static async findByType(type) {
    logger.debug(`Finding events by type: ${type}`);
    return await db.find('booking_events', { type });
  }

  static async findByDateRange(startDate, endDate) {
    logger.debug(`Finding events by date range: ${startDate} to ${endDate}`);
    const query = {
      at_ts: {
        $gte: startDate,
        $lt: endDate
      }
    };
    return await db.find('booking_events', query);
  }
}