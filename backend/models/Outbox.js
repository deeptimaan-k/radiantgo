import { db } from '../database/connection.js';
import { Outbox as OutboxModel } from '../database/schemas.js';

export class Outbox {
  static async findAll() {
    return await db.find('outbox');
  }

  static async findUnpublished() {
    const events = await db.find('outbox');
    return events.filter(event => !event.published_at);
  }

  static async create(outboxData) {
    const event = {
      booking_id: outboxData.booking_id,
      event_type: outboxData.event_type,
      payload: outboxData.payload || {}
    };
    
    return await db.insert('outbox', event);
  }

  static async markPublished(id) {
    return await db.update('outbox', { _id: id }, { 
      published_at: new Date().toISOString() 
    });
  }

  static async deleteById(id) {
    return await db.delete('outbox', { _id: id });
  }

  static async findByBookingId(bookingId) {
    return await db.find('outbox', { booking_id: bookingId });
  }

  static async cleanup(olderThanDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const query = {
      published_at: { $lt: cutoffDate }
    };
    
    const events = await db.find('outbox', query);
    for (const event of events) {
      await this.deleteById(event._id);
    }
    
    return events.length;
  }
}