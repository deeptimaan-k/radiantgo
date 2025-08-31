import express from 'express';
import logger from '../utils/logger.js';
import { bulkOperationService } from '../services/bulkOperationService.js';
import { performanceService } from '../services/performanceService.js';
import { cacheService } from '../services/cacheService.js';
import { distributedLock } from '../middleware/distributedLock.js';
import { validate, schemas } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Admin rate limiting (more restrictive)
const adminLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 admin operations per 5 minutes
  message: {
    type: 'https://tools.ietf.org/html/rfc6585#section-4',
    title: 'Admin Rate Limit Exceeded',
    status: 429,
    detail: 'Too many admin operations. Please wait before trying again.',
    retryAfter: 300
  }
});

// Bulk operations rate limiting
const bulkLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 bulk operations per 10 minutes
  message: {
    type: 'https://tools.ietf.org/html/rfc6585#section-4',
    title: 'Bulk Operation Rate Limit',
    status: 429,
    detail: 'Bulk operations are rate limited. Please wait before submitting another bulk request.',
    retryAfter: 600
  }
});

// POST /api/admin/bookings/bulk - Bulk create bookings
router.post('/bookings/bulk',
  bulkLimit,
  validate(schemas.bulkBookings),
  async (req, res, next) => {
    try {
      logger.info(`Admin bulk booking creation requested`, {
        requestId: req.id,
        bookingCount: req.validatedBody.bookings.length,
        userAgent: req.get('User-Agent')
      });

      const { bookings } = req.validatedBody;
      
      // Validate bulk size limits
      if (bookings.length > 1000) {
        return res.status(413).json({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.11',
          title: 'Payload Too Large',
          status: 413,
          detail: 'Maximum 1000 bookings allowed per bulk operation',
          instance: req.originalUrl
        });
      }

      const results = await bulkOperationService.createBookingsBulk(bookings);
      
      logger.info(`Bulk booking creation completed`, {
        requestId: req.id,
        successful: results.successful.length,
        failed: results.failed.length,
        processingTimeMs: results.processingTime
      });

      res.status(201).json({
        message: 'Bulk booking creation completed',
        results,
        summary: {
          total: bookings.length,
          successful: results.successful.length,
          failed: results.failed.length,
          successRate: `${((results.successful.length / bookings.length) * 100).toFixed(2)}%`,
          processingTime: `${results.processingTime}ms`
        }
      });

    } catch (error) {
      logger.error('Bulk booking creation error:', {
        error: error.message,
        requestId: req.id,
        bookingCount: req.validatedBody?.bookings?.length
      });
      next(error);
    }
  }
);

// POST /api/admin/bookings/status/bulk - Bulk update booking statuses
router.post('/bookings/status/bulk',
  bulkLimit,
  validate(schemas.bulkStatusUpdates),
  async (req, res, next) => {
    try {
      logger.info(`Admin bulk status update requested`, {
        requestId: req.id,
        updateCount: req.validatedBody.updates.length
      });

      const { updates } = req.validatedBody;
      
      if (updates.length > 500) {
        return res.status(413).json({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.11',
          title: 'Payload Too Large',
          status: 413,
          detail: 'Maximum 500 status updates allowed per bulk operation',
          instance: req.originalUrl
        });
      }

      const results = await bulkOperationService.updateBookingStatusBulk(updates);
      
      logger.info(`Bulk status update completed`, {
        requestId: req.id,
        successful: results.successful.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
        processingTimeMs: results.processingTime
      });

      res.json({
        message: 'Bulk status update completed',
        results,
        summary: {
          total: updates.length,
          successful: results.successful.length,
          failed: results.failed.length,
          skipped: results.skipped.length,
          successRate: `${((results.successful.length / updates.length) * 100).toFixed(2)}%`,
          processingTime: `${results.processingTime}ms`
        }
      });

    } catch (error) {
      logger.error('Bulk status update error:', {
        error: error.message,
        requestId: req.id,
        updateCount: req.validatedBody?.updates?.length
      });
      next(error);
    }
  }
);

// POST /api/admin/flights/bulk - Bulk import flights
router.post('/flights/bulk',
  bulkLimit,
  validate(schemas.bulkFlights),
  async (req, res, next) => {
    try {
      logger.info(`Admin bulk flight import requested`, {
        requestId: req.id,
        flightCount: req.validatedBody.flights.length
      });

      const { flights } = req.validatedBody;
      
      if (flights.length > 2000) {
        return res.status(413).json({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.11',
          title: 'Payload Too Large',
          status: 413,
          detail: 'Maximum 2000 flights allowed per bulk operation',
          instance: req.originalUrl
        });
      }

      const results = await bulkOperationService.importFlightsBulk(flights);
      
      logger.info(`Bulk flight import completed`, {
        requestId: req.id,
        successful: results.results.length,
        failed: results.errors.length
      });

      res.status(201).json({
        message: 'Bulk flight import completed',
        results,
        summary: {
          total: flights.length,
          successful: results.results.length,
          failed: results.errors.length,
          successRate: `${((results.results.length / flights.length) * 100).toFixed(2)}%`
        }
      });

    } catch (error) {
      logger.error('Bulk flight import error:', {
        error: error.message,
        requestId: req.id,
        flightCount: req.validatedBody?.flights?.length
      });
      next(error);
    }
  }
);

// GET /api/admin/performance - Get system performance metrics
router.get('/performance', adminLimit, async (req, res, next) => {
  try {
    logger.info('Admin performance metrics requested', { requestId: req.id });

    const [health, cacheStats, scalingRecommendations] = await Promise.all([
      performanceService.checkSystemHealth(),
      cacheService.getStats(),
      performanceService.getScalingRecommendations()
    ]);

    const response = {
      timestamp: new Date().toISOString(),
      systemHealth: health,
      cacheStatistics: cacheStats,
      scalingRecommendations,
      performanceMetrics: {
        requestMetrics: Object.fromEntries(performanceService.metrics.requests),
        cacheHitRate: performanceService.metrics.cacheHitRate,
        averageResponseTime: performanceService.calculateAverageResponseTime()
      }
    };

    logger.info('Performance metrics retrieved', {
      requestId: req.id,
      systemStatus: health.status,
      recommendationCount: scalingRecommendations.recommendations.length
    });

    res.json(response);

  } catch (error) {
    logger.error('Performance metrics error:', {
      error: error.message,
      requestId: req.id
    });
    next(error);
  }
});

// POST /api/admin/cache/warm - Warm up caches
router.post('/cache/warm', adminLimit, async (req, res, next) => {
  try {
    logger.info('Admin cache warming requested', { requestId: req.id });

    await cacheService.warmCache();

    logger.info('Cache warming completed', { requestId: req.id });

    res.json({
      message: 'Cache warming completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Cache warming error:', {
      error: error.message,
      requestId: req.id
    });
    next(error);
  }
});

// DELETE /api/admin/cache/clear - Clear all caches
router.delete('/cache/clear', adminLimit, async (req, res, next) => {
  try {
    logger.info('Admin cache clear requested', { requestId: req.id });

    await cacheService.invalidate('*');

    logger.info('Cache cleared', { requestId: req.id });

    res.json({
      message: 'All caches cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Cache clear error:', {
      error: error.message,
      requestId: req.id
    });
    next(error);
  }
});

// GET /api/admin/locks - View active distributed locks
router.get('/locks', adminLimit, async (req, res, next) => {
  try {
    logger.info('Admin lock status requested', { requestId: req.id });

    // This would query Redis for active locks in production
    const activeLocks = await this.getActiveLocks();

    res.json({
      activeLocks,
      timestamp: new Date().toISOString(),
      lockCount: activeLocks.length
    });

  } catch (error) {
    logger.error('Lock status error:', {
      error: error.message,
      requestId: req.id
    });
    next(error);
  }
});

async function getActiveLocks() {
  try {
    if (redisService.client) {
      const lockKeys = await redisService.client.keys('lock:*');
      const locks = [];
      
      for (const key of lockKeys) {
        const value = await redisService.client.get(key);
        const ttl = await redisService.client.ttl(key);
        
        locks.push({
          key: key.replace('lock:', ''),
          value,
          ttlSeconds: ttl,
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
        });
      }
      
      return locks;
    } else {
      // In-memory locks
      const locks = [];
      for (const [key, value] of redisService.cache.entries()) {
        if (key.startsWith('lock:')) {
          locks.push({
            key: key.replace('lock:', ''),
            value,
            ttlSeconds: -1, // Unknown TTL for in-memory
            expiresAt: 'unknown'
          });
        }
      }
      return locks;
    }
  } catch (error) {
    logger.error('Error getting active locks:', { error: error.message });
    return [];
  }
}

export { router as adminRoutes };