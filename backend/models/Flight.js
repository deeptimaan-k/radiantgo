import { db } from '../database/connection.js';
import { Flight as FlightModel } from '../database/schemas.js';

export class Flight {
  static async findAll() {
    return await db.find('flights');
  }

  static async find(query) {
    return await db.find('flights', query);
  }

  static async findByRoute(origin, destination) {
    return await db.find('flights', { origin, destination });
  }

  static async findById(id) {
    return await db.findOne('flights', { _id: id });
  }

  static async create(flightData) {
    // Validate departure is before arrival
    if (new Date(flightData.departure_ts) >= new Date(flightData.arrival_ts)) {
      throw new Error('Departure time must be before arrival time');
    }

    // Validate origin and destination are different
    if (flightData.origin === flightData.destination) {
      throw new Error('Origin and destination must be different');
    }

    return await db.insert('flights', flightData);
  }

  static async updateById(id, updateData) {
    return await db.update('flights', { _id: id }, updateData);
  }

  static async deleteById(id) {
    return await db.delete('flights', { _id: id });
  }

  static async findByDateRange(origin, destination, startDate, endDate) {
    const query = {
      origin,
      destination,
      departure_ts: {
        $gte: startDate,
        $lt: endDate
      }
    };
    return await db.find('flights', query);
  }
}