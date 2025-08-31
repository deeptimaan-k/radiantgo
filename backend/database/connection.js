import { mongoConnection } from './mongodb.js';
import { Flight, Booking, BookingEvent, User, Outbox } from './schemas.js';
import logger from '../utils/logger.js';

// Database abstraction layer that works with both MongoDB and in-memory storage
// In production, this connects to MongoDB
// In WebContainer, this uses in-memory simulation

class MemoryDB {
  constructor() {
    this.collections = {
      flights: [],
      bookings: [],
      booking_events: [],
      users: [],
      outbox: []
    };
    
    // Initialize with sample data
    this.initSampleData();
    this.useMongoose = false;
  }

  async initialize() {
    logger.info('Initializing database connection...');
    
    // Try to connect to MongoDB in production
    if (process.env.NODE_ENV === 'production' || process.env.MONGODB_URI) {
      try {
        logger.info('Attempting MongoDB connection...');
        await mongoConnection.connect();
        this.useMongoose = true;
        logger.info('🗄️ Using MongoDB for data storage');
        
        // Initialize MongoDB with sample data if collections are empty
        await this.initMongoSampleData();
      } catch (error) {
        logger.warn('📝 MongoDB unavailable, using in-memory storage', { error: error.message });
        this.useMongoose = false;
      }
    } else {
      logger.info('📝 Using in-memory storage (development mode)');
    }
  }

  async initMongoSampleData() {
    try {
      logger.debug('Checking if MongoDB sample data exists...');
      // Check if data already exists
      const flightCount = await Flight.countDocuments();
      if (flightCount === 0) {
        logger.info('🌱 Seeding MongoDB with sample data...');
        
        // Insert sample flights
        await Flight.insertMany([
          {
            flight_number: 'RG001',
            airline: 'RadiantGo Airlines',
            origin: 'NYC',
            destination: 'LAX',
            departure_ts: new Date('2025-01-20T10:00:00Z'),
            arrival_ts: new Date('2025-01-20T16:00:00Z')
          },
          {
            flight_number: 'RG002',
            airline: 'RadiantGo Airlines',
            origin: 'DEL',
            destination: 'BLR',
            departure_ts: new Date('2025-01-20T08:00:00Z'),
            arrival_ts: new Date('2025-01-20T10:30:00Z')
          },
          {
            flight_number: 'RG003',
            airline: 'RadiantGo Airlines',
            origin: 'DEL',
            destination: 'BOM',
            departure_ts: new Date('2025-01-20T14:00:00Z'),
            arrival_ts: new Date('2025-01-20T16:00:00Z')
          },
          {
            flight_number: 'RG004',
            airline: 'RadiantGo Airlines',
            origin: 'BOM',
            destination: 'BLR',
            departure_ts: new Date('2025-01-20T18:00:00Z'),
            arrival_ts: new Date('2025-01-20T19:30:00Z')
          }
        ]);
        logger.debug('Sample flights inserted into MongoDB');

        // Insert sample user
        await User.create({
          name: 'Admin User',
          email: 'admin@radiantgo.com',
          role: 'admin'
        });
        logger.debug('Sample user created in MongoDB');

        logger.info('✅ Sample data seeded successfully');
      } else {
        logger.debug(`MongoDB already contains ${flightCount} flights, skipping seed`);
      }
    } catch (error) {
      logger.error('❌ Error seeding sample data:', { error: error.message });
    }
  }

  initSampleData() {
    logger.debug('Initializing in-memory sample data...');
    
    // Sample flights
    this.collections.flights = [
      {
        _id: '1',
        flight_number: 'RG001',
        airline: 'RadiantGo Airlines',
        origin: 'NYC',
        destination: 'LAX',
        departure_ts: new Date('2025-01-20T10:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-20T16:00:00Z').toISOString()
      },
      {
        _id: '2',
        flight_number: 'RG002',
        airline: 'RadiantGo Airlines',
        origin: 'DEL',
        destination: 'BLR',
        departure_ts: new Date('2025-01-20T08:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-20T10:30:00Z').toISOString()
      },
      {
        _id: '3',
        flight_number: 'RG003',
        airline: 'RadiantGo Airlines',
        origin: 'DEL',
        destination: 'BOM',
        departure_ts: new Date('2025-01-20T14:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-20T16:00:00Z').toISOString()
      },
      {
        _id: '4',
        flight_number: 'RG004',
        airline: 'RadiantGo Airlines',
        origin: 'BOM',
        destination: 'BLR',
        departure_ts: new Date('2025-01-20T18:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-20T19:30:00Z').toISOString()
      },
      {
        _id: '5',
        flight_number: 'RG005',
        airline: 'RadiantGo Airlines',
        origin: 'DEL',
        destination: 'HYD',
        departure_ts: new Date('2025-01-20T12:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-20T14:00:00Z').toISOString()
      },
      {
        _id: '6',
        flight_number: 'RG006',
        airline: 'RadiantGo Airlines',
        origin: 'HYD',
        destination: 'BLR',
        departure_ts: new Date('2025-01-21T08:00:00Z').toISOString(),
        arrival_ts: new Date('2025-01-21T09:30:00Z').toISOString()
      }
    ];

    // Sample users
    this.collections.users = [
      {
        _id: '1',
        name: 'Admin User',
        email: 'admin@radiantgo.com',
        role: 'admin'
      }
    ];
    
    logger.debug(`Initialized sample data: ${this.collections.flights.length} flights, ${this.collections.users.length} users`);
  }

  // Simulate MongoDB operations
  async find(collection, query = {}) {
    logger.debug(`DB find operation: ${collection}`, { query });
    
    if (this.useMongoose) {
      return await this.findMongo(collection, query);
    }
    
    const data = this.collections[collection] || [];
    if (Object.keys(query).length === 0) {
      logger.debug(`Returning all ${data.length} records from ${collection}`);
      return data;
    }
    
    const results = data.filter(item => {
      return Object.entries(query).every(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle MongoDB-style operators
          if (value.$gte && value.$lt) {
            const itemDate = new Date(item[key]);
            return itemDate >= new Date(value.$gte) && itemDate < new Date(value.$lt);
          }
          if (value.$gte) {
            return new Date(item[key]) >= new Date(value.$gte);
          }
          if (value.$lt) {
            return new Date(item[key]) < new Date(value.$lt);
          }
        }
        return item[key] === value;
      });
    });
    
    logger.debug(`Found ${results.length} matching records in ${collection}`, { query });
    return results;
  }

  async findMongo(collection, query = {}) {
    logger.debug(`MongoDB find operation: ${collection}`, { query });
    const Model = this.getMongoModel(collection);
    if (!Model) return [];
    
    try {
      const results = await Model.find(query).lean();
      logger.debug(`MongoDB find completed: ${results.length} records from ${collection}`);
      return results.map(doc => ({
        ...doc,
        _id: doc._id.toString()
      }));
    } catch (error) {
      logger.error(`MongoDB find error for ${collection}:`, { error: error.message, query });
      return [];
    }
  }

  async findOne(collection, query) {
    logger.debug(`DB findOne operation: ${collection}`, { query });
    
    if (this.useMongoose) {
      const Model = this.getMongoModel(collection);
      if (!Model) return null;
      
      try {
        const result = await Model.findOne(query).lean();
        logger.debug(`MongoDB findOne result: ${result ? 'found' : 'not found'} in ${collection}`);
        return result ? { ...result, _id: result._id.toString() } : null;
      } catch (error) {
        logger.error(`MongoDB findOne error for ${collection}:`, { error: error.message, query });
        return null;
      }
    }
    
    const results = await this.find(collection, query);
    logger.debug(`Memory findOne result: ${results.length > 0 ? 'found' : 'not found'} in ${collection}`);
    return results[0] || null;
  }

  async insert(collection, document) {
    logger.debug(`DB insert operation: ${collection}`, { 
      documentKeys: Object.keys(document) 
    });
    
    if (this.useMongoose) {
      const Model = this.getMongoModel(collection);
      if (!Model) return null;
      
      try {
        const result = await Model.create(document);
        logger.debug(`MongoDB insert successful: ${collection}`, { id: result._id.toString() });
        return { ...result.toObject(), _id: result._id.toString() };
      } catch (error) {
        logger.error(`MongoDB insert error for ${collection}:`, { 
          error: error.message, 
          document: Object.keys(document) 
        });
        throw error;
      }
    }
    
    if (!this.collections[collection]) {
      this.collections[collection] = [];
    }
    
    const newDoc = {
      ...document,
      _id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.collections[collection].push(newDoc);
    logger.debug(`Memory insert successful: ${collection}`, { id: newDoc._id });
    return newDoc;
  }

  async update(collection, query, update) {
    logger.debug(`DB update operation: ${collection}`, { 
      query, 
      updateKeys: Object.keys(update) 
    });
    
    if (this.useMongoose) {
      const Model = this.getMongoModel(collection);
      if (!Model) return null;
      
      try {
        const result = await Model.findOneAndUpdate(
          query, 
          { ...update, updated_at: new Date() }, 
          { new: true, lean: true }
        );
        logger.debug(`MongoDB update result: ${result ? 'updated' : 'not found'} in ${collection}`);
        return result ? { ...result, _id: result._id.toString() } : null;
      } catch (error) {
        logger.error(`MongoDB update error for ${collection}:`, { 
          error: error.message, 
          query, 
          update 
        });
        return null;
      }
    }
    
    const items = this.collections[collection] || [];
    const index = items.findIndex(item => 
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
    
    if (index !== -1) {
      this.collections[collection][index] = {
        ...this.collections[collection][index],
        ...update,
        updated_at: new Date().toISOString()
      };
      logger.debug(`Memory update successful: ${collection}`, { 
        id: this.collections[collection][index]._id 
      });
      return this.collections[collection][index];
    }
    logger.debug(`Memory update failed: record not found in ${collection}`, { query });
    return null;
  }

  async delete(collection, query) {
    logger.debug(`DB delete operation: ${collection}`, { query });
    
    if (this.useMongoose) {
      const Model = this.getMongoModel(collection);
      if (!Model) return null;
      
      try {
        const result = await Model.findOneAndDelete(query).lean();
        logger.debug(`MongoDB delete result: ${result ? 'deleted' : 'not found'} in ${collection}`);
        return result ? { ...result, _id: result._id.toString() } : null;
      } catch (error) {
        logger.error(`MongoDB delete error for ${collection}:`, { 
          error: error.message, 
          query 
        });
        return null;
      }
    }
    
    const items = this.collections[collection] || [];
    const index = items.findIndex(item => 
      Object.entries(query).every(([key, value]) => item[key] === value)
    );
    
    if (index !== -1) {
      const deleted = this.collections[collection].splice(index, 1)[0];
      logger.debug(`Memory delete successful: ${collection}`, { id: deleted._id });
      return this.collections[collection].splice(index, 1)[0];
    }
    logger.debug(`Memory delete failed: record not found in ${collection}`, { query });
    return null;
  }

  getMongoModel(collection) {
    const modelMap = {
      'flights': Flight,
      'bookings': Booking,
      'booking_events': BookingEvent,
      'users': User,
      'outbox': Outbox
    };
    return modelMap[collection];
  }

  async disconnect() {
    logger.info('Disconnecting from database...');
    if (this.useMongoose) {
      await mongoConnection.disconnect();
    }
    logger.info('Database disconnected');
  }
}

export const db = new MemoryDB();