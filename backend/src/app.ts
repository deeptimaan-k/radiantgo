import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { createRateLimit } from './middlewares/rateLimit';
import { metricsMiddleware } from './middlewares/monitoring';
import { redisClient } from './utils/redis';
import flightRoutes from './routes/flight.routes';
import bookingRoutes from './routes/booking.routes';
import authRoutes from './routes/auth.routes';
import logger from './utils/logger';
import { systemMonitor } from './utils/monitoring';
import { healthChecker } from './utils/health';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.config();
    this.connectDatabases();
    this.routes();
    this.errorHandling();
    this.startMonitoring();
  }

  private config(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true
    }));

    // Rate limiting
    this.app.use(createRateLimit());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging
    this.app.use(requestLogger);
    this.app.use(metricsMiddleware);

    // Health check
    this.app.get('/health', async (req, res) => {
      try {
        const health = await healthChecker.checkHealth();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check error:', error);
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed'
        });
      }
    });
  }

  private async connectDatabases(): Promise<void> {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/radiantgo');
      logger.info('Connected to MongoDB');

      // Connect to Redis
      try {
        await redisClient.connect();
        logger.info('Connected to Redis');
      } catch (redisError) {
        logger.warn('Redis connection failed, continuing without Redis:', redisError);
        // Continue without Redis - the app should still work for basic operations
      }
    } catch (error) {
      logger.error('Database connection error:', error);
      process.exit(1);
    }
  }

  private startMonitoring(): void {
    // Start system monitoring in production
    if (process.env.NODE_ENV === 'production') {
      systemMonitor.startMonitoring(300000); // Every 5 minutes
    }
  }

  private routes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/flights', flightRoutes);
    this.app.use('/api/bookings', bookingRoutes);

    // Root route for testing
    this.app.get('/', (req, res) => {
      res.json({
        message: 'RadiantGo API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use(notFoundHandler);
  }

  private errorHandling(): void {
    this.app.use(errorHandler);
  }

  public async shutdown(): Promise<void> {
    try {
      systemMonitor.stopMonitoring();
      await mongoose.connection.close();
      await redisClient.disconnect();
      logger.info('Graceful shutdown completed');
    } catch (error) {
      logger.error('Error during shutdown:', error);
    }
  }
}

export default App;