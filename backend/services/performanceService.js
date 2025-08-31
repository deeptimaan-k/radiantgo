import { cacheService } from './cacheService.js';
import { redisService } from './redisService.js';
import logger from '../utils/logger.js';

export class PerformanceService {
  constructor() {
    this.metrics = {
      requests: new Map(),
      responseTime: new Map(),
      cacheHitRate: { hits: 0, misses: 0 },
      lockContention: new Map(),
      errorRate: new Map()
    };
    
    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Track request performance metrics
   */
  trackRequest(req, res, next) {
    const startTime = Date.now();
    const route = `${req.method} ${req.route?.path || req.path}`;
    
    // Track request count
    const currentCount = this.metrics.requests.get(route) || 0;
    this.metrics.requests.set(route, currentCount + 1);

    // Track response time
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      const times = this.metrics.responseTime.get(route) || [];
      times.push(responseTime);
      
      // Keep only last 1000 measurements for memory efficiency
      if (times.length > 1000) {
        times.shift();
      }
      
      this.metrics.responseTime.set(route, times);
      
      // Log slow requests
      if (responseTime > 1000) {
        logger.warn(`Slow request detected: ${route}`, {
          responseTime,
          requestId: req.id,
          status: res.statusCode
        });
      }
    });

    next();
  }

  /**
   * Database connection pooling optimization
   */
  async optimizeConnections() {
    logger.info('🔧 Optimizing database connections for high volume...');
    
    try {
      // MongoDB connection pool optimization
      if (process.env.MONGODB_URI) {
        const mongoose = await import('mongoose');
        
        // Optimize connection pool for high volume
        mongoose.set('maxPoolSize', 50);        // Increase pool size
        mongoose.set('minPoolSize', 10);        // Maintain minimum connections
        mongoose.set('maxIdleTimeMS', 30000);   // Close idle connections after 30s
        mongoose.set('serverSelectionTimeoutMS', 5000);
        mongoose.set('socketTimeoutMS', 45000);
        mongoose.set('bufferMaxEntries', 0);    // Disable mongoose buffering
        mongoose.set('bufferCommands', false);
        
        logger.info('✅ MongoDB connection pool optimized for high volume');
      }

      // Redis connection optimization
      if (redisService.client) {
        // Configure Redis for high throughput
        await redisService.client.config('SET', 'maxmemory-policy', 'allkeys-lru');
        await redisService.client.config('SET', 'maxmemory', '512mb');
        
        logger.info('✅ Redis optimized for high volume');
      }

    } catch (error) {
      logger.error('Connection optimization error:', { error: error.message });
    }
  }

  /**
   * Batch processing for high-volume operations
   */
  async processBatch(items, batchSize = 100, processor) {
    logger.info(`🔄 Processing ${items.length} items in batches of ${batchSize}`);
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(items.length / batchSize);
      
      logger.debug(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);
      
      try {
        const startTime = Date.now();
        const batchResults = await Promise.allSettled(
          batch.map(item => processor(item))
        );
        const processingTime = Date.now() - startTime;
        
        // Separate successful results from errors
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            errors.push({
              item: batch[index],
              error: result.reason
            });
          }
        });
        
        logger.debug(`Batch ${batchNumber} completed in ${processingTime}ms`, {
          successful: batchResults.filter(r => r.status === 'fulfilled').length,
          failed: batchResults.filter(r => r.status === 'rejected').length
        });
        
        // Rate limiting between batches to prevent overwhelming the system
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
      } catch (error) {
        logger.error(`Batch ${batchNumber} processing error:`, { 
          error: error.message,
          batchSize: batch.length 
        });
        errors.push({ batch, error });
      }
    }
    
    logger.info(`✅ Batch processing completed`, {
      totalItems: items.length,
      successful: results.length,
      failed: errors.length,
      successRate: `${((results.length / items.length) * 100).toFixed(2)}%`
    });
    
    return { results, errors };
  }

  /**
   * Query optimization for high-volume reads
   */
  async optimizeQuery(collection, query, options = {}) {
    const cacheKey = `query:${collection}:${JSON.stringify(query)}`;
    
    // Check cache first
    const cached = await cacheService.get(cacheKey, 'queries');
    if (cached && !options.skipCache) {
      logger.debug(`Query cache hit: ${collection}`, { query });
      return cached;
    }

    // Execute query with performance tracking
    const startTime = Date.now();
    logger.debug(`Executing optimized query: ${collection}`, { query, options });
    
    try {
      // Add query hints for performance
      const optimizedOptions = {
        ...options,
        lean: true,           // Return plain objects instead of Mongoose documents
        limit: options.limit || 1000,  // Prevent unbounded queries
        sort: options.sort || { created_at: -1 }
      };

      // This would be implemented with your actual database layer
      const results = await this.executeQuery(collection, query, optimizedOptions);
      const queryTime = Date.now() - startTime;
      
      logger.debug(`Query executed in ${queryTime}ms: ${collection}`, {
        resultCount: results.length,
        queryTime
      });

      // Cache results if query was fast and returned reasonable amount of data
      if (queryTime < 500 && results.length < 1000) {
        await cacheService.set(cacheKey, results, 'queries', 300);
      }

      return results;
    } catch (error) {
      logger.error('Optimized query error:', { 
        error: error.message,
        collection,
        query 
      });
      throw error;
    }
  }

  async executeQuery(collection, query, options) {
    // This is a placeholder - implement with your actual database layer
    // For now, delegate to existing db layer
    const { db } = await import('../database/connection.js');
    return await db.find(collection, query);
  }

  /**
   * Performance monitoring and alerting
   */
  startMetricsCollection() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Log performance summary every 5 minutes
    setInterval(() => {
      this.logPerformanceSummary();
    }, 300000);
  }

  collectMetrics() {
    try {
      const now = Date.now();
      const windowStart = now - 60000; // 1 minute window

      // Calculate cache hit rate
      const totalCacheOps = this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses;
      const hitRate = totalCacheOps > 0 ? 
        (this.metrics.cacheHitRate.hits / totalCacheOps * 100).toFixed(2) : 0;

      // Calculate average response times
      const avgResponseTimes = new Map();
      for (const [route, times] of this.metrics.responseTime.entries()) {
        const recentTimes = times.filter(time => time > windowStart);
        if (recentTimes.length > 0) {
          const avg = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
          avgResponseTimes.set(route, Math.round(avg));
        }
      }

      logger.debug('Performance metrics collected', {
        cacheHitRate: `${hitRate}%`,
        avgResponseTimes: Object.fromEntries(avgResponseTimes),
        totalRequests: Array.from(this.metrics.requests.values()).reduce((sum, count) => sum + count, 0)
      });

    } catch (error) {
      logger.error('Metrics collection error:', { error: error.message });
    }
  }

  logPerformanceSummary() {
    try {
      const totalRequests = Array.from(this.metrics.requests.values()).reduce((sum, count) => sum + count, 0);
      const totalCacheOps = this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses;
      const hitRate = totalCacheOps > 0 ? 
        (this.metrics.cacheHitRate.hits / totalCacheOps * 100).toFixed(2) : 0;

      // Calculate P95 response times
      const allResponseTimes = [];
      for (const times of this.metrics.responseTime.values()) {
        allResponseTimes.push(...times);
      }
      
      allResponseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(allResponseTimes.length * 0.95);
      const p95ResponseTime = allResponseTimes[p95Index] || 0;

      logger.info('📊 Performance Summary (5min window)', {
        totalRequests,
        cacheHitRate: `${hitRate}%`,
        p95ResponseTime: `${p95ResponseTime}ms`,
        requestsPerSecond: (totalRequests / 300).toFixed(2),
        topRoutes: this.getTopRoutes(5)
      });

      // Alert on performance issues
      if (parseFloat(hitRate) < 70) {
        logger.warn('⚠️ Low cache hit rate detected', { hitRate: `${hitRate}%` });
      }
      
      if (p95ResponseTime > 2000) {
        logger.warn('⚠️ High response times detected', { p95ResponseTime: `${p95ResponseTime}ms` });
      }

    } catch (error) {
      logger.error('Performance summary error:', { error: error.message });
    }
  }

  getTopRoutes(limit = 5) {
    const sortedRoutes = Array.from(this.metrics.requests.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
    
    return Object.fromEntries(sortedRoutes);
  }

  /**
   * Memory usage optimization
   */
  async optimizeMemory() {
    logger.info('🧹 Optimizing memory usage...');
    
    try {
      // Clear old metrics
      const cutoffTime = Date.now() - 3600000; // 1 hour ago
      
      for (const [route, times] of this.metrics.responseTime.entries()) {
        const recentTimes = times.filter(time => time > cutoffTime);
        this.metrics.responseTime.set(route, recentTimes);
      }

      // Reset cache hit rate counters periodically
      if (this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses > 10000) {
        this.metrics.cacheHitRate = { hits: 0, misses: 0 };
        logger.debug('Cache hit rate counters reset');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.debug('Garbage collection triggered');
      }

      logger.info('✅ Memory optimization completed');
    } catch (error) {
      logger.error('Memory optimization error:', { error: error.message });
    }
  }

  /**
   * Database index recommendations based on query patterns
   */
  async analyzeQueryPatterns() {
    logger.info('📈 Analyzing query patterns for index optimization...');
    
    try {
      const recommendations = [];
      
      // Analyze most frequent queries
      const queryPatterns = new Map();
      
      // This would analyze actual query logs in production
      // For now, provide static recommendations based on expected usage
      
      recommendations.push({
        collection: 'bookings',
        index: '{ ref_id: 1 }',
        reason: 'High frequency booking lookups by reference ID',
        priority: 'HIGH'
      });
      
      recommendations.push({
        collection: 'bookings',
        index: '{ status: 1, updated_at: -1 }',
        reason: 'Status-based queries with recency sorting',
        priority: 'HIGH'
      });
      
      recommendations.push({
        collection: 'flights',
        index: '{ origin: 1, destination: 1, departure_ts: 1 }',
        reason: 'Route search queries with date filtering',
        priority: 'CRITICAL'
      });
      
      recommendations.push({
        collection: 'booking_events',
        index: '{ booking_id: 1, at_ts: -1 }',
        reason: 'Timeline queries for booking details',
        priority: 'HIGH'
      });

      logger.info('📋 Query pattern analysis completed', {
        recommendationCount: recommendations.length,
        criticalIndexes: recommendations.filter(r => r.priority === 'CRITICAL').length
      });

      return recommendations;
    } catch (error) {
      logger.error('Query pattern analysis error:', { error: error.message });
      return [];
    }
  }

  /**
   * Load balancing and circuit breaker patterns
   */
  async checkSystemHealth() {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {},
      metrics: {}
    };

    try {
      // Check Redis health
      if (redisService.isConnected) {
        const redisStart = Date.now();
        await redisService.get('health:check');
        const redisLatency = Date.now() - redisStart;
        
        health.services.redis = {
          status: redisLatency < 100 ? 'healthy' : 'degraded',
          latency: redisLatency,
          connected: true
        };
      } else {
        health.services.redis = {
          status: 'unavailable',
          connected: false
        };
      }

      // Check database health
      const dbStart = Date.now();
      try {
        const { db } = await import('../database/connection.js');
        await db.findOne('bookings', {}); // Simple query to test DB
        const dbLatency = Date.now() - dbStart;
        
        health.services.database = {
          status: dbLatency < 200 ? 'healthy' : 'degraded',
          latency: dbLatency,
          connected: true
        };
      } catch (dbError) {
        health.services.database = {
          status: 'unavailable',
          error: dbError.message,
          connected: false
        };
      }

      // Calculate overall system metrics
      const totalRequests = Array.from(this.metrics.requests.values()).reduce((sum, count) => sum + count, 0);
      const totalCacheOps = this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses;
      
      health.metrics = {
        totalRequests,
        cacheHitRate: totalCacheOps > 0 ? 
          `${(this.metrics.cacheHitRate.hits / totalCacheOps * 100).toFixed(2)}%` : 'N/A',
        averageResponseTime: this.calculateAverageResponseTime(),
        requestsPerSecond: (totalRequests / 300).toFixed(2) // 5-minute window
      };

      // Determine overall health status
      const serviceStatuses = Object.values(health.services).map(s => s.status);
      if (serviceStatuses.includes('unavailable')) {
        health.status = 'unhealthy';
      } else if (serviceStatuses.includes('degraded')) {
        health.status = 'degraded';
      }

      logger.debug('System health check completed', { 
        status: health.status,
        serviceCount: Object.keys(health.services).length 
      });

      return health;
    } catch (error) {
      logger.error('System health check error:', { error: error.message });
      health.status = 'error';
      health.error = error.message;
      return health;
    }
  }

  calculateAverageResponseTime() {
    const allTimes = [];
    for (const times of this.metrics.responseTime.values()) {
      allTimes.push(...times);
    }
    
    if (allTimes.length === 0) return 0;
    
    const average = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
    return Math.round(average);
  }

  /**
   * Auto-scaling recommendations based on load
   */
  async getScalingRecommendations() {
    const health = await this.checkSystemHealth();
    const recommendations = [];

    try {
      const avgResponseTime = this.calculateAverageResponseTime();
      const totalRequests = Array.from(this.metrics.requests.values()).reduce((sum, count) => sum + count, 0);
      const requestsPerSecond = totalRequests / 300; // 5-minute window

      // High load indicators
      if (requestsPerSecond > 100) {
        recommendations.push({
          type: 'scale_up',
          component: 'backend',
          reason: `High request rate: ${requestsPerSecond.toFixed(2)} req/s`,
          priority: 'HIGH'
        });
      }

      if (avgResponseTime > 1000) {
        recommendations.push({
          type: 'optimize',
          component: 'database',
          reason: `High response times: ${avgResponseTime}ms average`,
          priority: 'CRITICAL'
        });
      }

      // Cache optimization
      const cacheHitRate = this.metrics.cacheHitRate.hits / 
        (this.metrics.cacheHitRate.hits + this.metrics.cacheHitRate.misses) * 100;
      
      if (cacheHitRate < 70) {
        recommendations.push({
          type: 'cache_optimization',
          component: 'redis',
          reason: `Low cache hit rate: ${cacheHitRate.toFixed(2)}%`,
          priority: 'MEDIUM'
        });
      }

      logger.info('📊 Scaling recommendations generated', {
        recommendationCount: recommendations.length,
        criticalCount: recommendations.filter(r => r.priority === 'CRITICAL').length
      });

      return {
        timestamp: new Date().toISOString(),
        currentLoad: {
          requestsPerSecond: requestsPerSecond.toFixed(2),
          avgResponseTime,
          cacheHitRate: `${cacheHitRate.toFixed(2)}%`
        },
        recommendations,
        systemHealth: health.status
      };

    } catch (error) {
      logger.error('Scaling recommendations error:', { error: error.message });
      return { error: error.message, recommendations: [] };
    }
  }
}

export const performanceService = new PerformanceService();