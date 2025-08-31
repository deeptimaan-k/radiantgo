import mongoose from 'mongoose';

class MongoDBConnection {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/radiantgo';
      
      // MongoDB connection options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false,
      };

      this.connection = await mongoose.connect(mongoUri, options);
      this.isConnected = true;
      
      console.log('✅ Connected to MongoDB');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('📡 MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        this.isConnected = true;
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        console.log('📡 Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  isReady() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const mongoConnection = new MongoDBConnection();