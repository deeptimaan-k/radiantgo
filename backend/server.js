import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import { requestLogger, addRequestId, logRequestBody } from './middleware/requestLogger.js';
import { flightRoutes } from './routes/flights.js';
import { bookingRoutes } from './routes/bookings.js';
import { routeRoutes } from './routes/routes.js';
import { eventRoutes } from './routes/events.js';
import { userRoutes } from './routes/users.js';
import { adminRoutes } from './routes/admin.js';
import { redisService } from './services/redisService.js';
import { messageService } from './services/messageService.js';
import { performanceService } from './services/performanceService.js';
import { cacheService } from './services/cacheService.js';
import { db } from './database/connection.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging and tracing
app.use(addRequestId);
app.use(requestLogger);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logRequestBody);

// Health check
app.get('/health', async (req, res) => {
  try {
    logger.debug('Health check requested', { requestId: req.id });
    
    const health = await performanceService.checkSystemHealth();
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
      status: health.status,
      timestamp: new Date().toISOString(),
      service: 'RadiantGo Backend',
      version: '1.0.0',
      uptime: process.uptime(),
      ...health
    });
  } catch (error) {
    logger.error('Health check error:', { error: error.message, requestId: req.id });
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/flights', flightRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// RFC 7807 Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
async function startServer() {
  try {
    logger.info('🚀 Starting RadiantGo Backend Server...');
    
    // Initialize database, Redis and RabbitMQ connections
    logger.info('📊 Initializing database connection...');
    await db.initialize();
    
    logger.info('📋 Initializing Redis connection...');
    await redisService.connect();
    
    logger.info('📤 Initializing message service...');
    await messageService.connect();
    
    logger.info('⚡ Optimizing system for high volume...');
    await performanceService.optimizeConnections();
    
    logger.info('🔥 Warming up caches...');
    await cacheService.warmCache();
    
    app.listen(PORT, () => {
      logger.info(`🚀 RadiantGo Backend running on port ${PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${PORT}/health`);
      logger.info(`🔧 Admin endpoints available at http://localhost:${PORT}/api/admin/*`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔧 Log level: ${logger.level}`);
      logger.info(`📊 Performance monitoring: ENABLED`);
      logger.info(`🔒 Distributed locking: ENABLED`);
      logger.info(`💾 Caching: ${redisService.isConnected ? 'Redis' : 'In-Memory'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, gracefully shutting down...');
  await performanceService.optimizeMemory();
  await db.disconnect();
  await redisService.disconnect();
  await messageService.disconnect();
  logger.info('✅ Graceful shutdown completed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, gracefully shutting down...');
  await performanceService.optimizeMemory();
  await db.disconnect();
  await redisService.disconnect();
  await messageService.disconnect();
  logger.info('✅ Graceful shutdown completed');
  process.exit(0);
});

startServer();