import { redisService } from './redisService.js';
import logger from '../utils/logger.js';

export class CacheService {
  constructor() {
    this.redis = redisService;
    this.defaultTTL = {
      routes: 300,      // 5 minutes for route searches
      flights: 3600,    // 1 hour for flight data
      bookings: 60,     // 1 minute for booking data
      users: 1800       // 30 minutes for user data
    };
  }

  /**
   * Multi-level caching with automatic invalidation
   */
  async get(key, type = 'default') {
    try {
      logger.debug(`Cache GET: ${key} (type: ${type})`);
      const value = await this.redis.get(key);
      
      if (value) {
        logger.debug(`Cache HIT: ${key}`);
        return value;
      }
      
      logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache GET error:', { error: error.message, key, type });
      return null;
    }
  }

  async set(key, value, type = 'default', customTTL = null) {
    try {
      const ttl = customTTL || this.defaultTTL[type] || this.defaultTTL.default;
      logger.debug(`Cache SET: ${key} (type: ${type}, TTL: ${ttl}s)`);
      
      await this.redis.set(key, value, ttl);
      logger.debug(`Cache SET successful: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache SET error:', { error: error.message, key, type });
      return false;
    }
  }

  async invalidate(pattern) {
    try {
      logger.debug(`Cache invalidation: ${pattern}`);
      
      if (this.redis.client) {
        // Redis pattern-based deletion
        const keys = await this.redis.client.keys(pattern);
        if (keys.length > 0) {
          await this.redis.client.del(...keys);
          logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
        }
      } else {
        // In-memory cache pattern matching
        const keysToDelete = [];
        for (const key of this.redis.cache.keys()) {
          if (this.matchesPattern(key, pattern)) {
            keysToDelete.push(key);
          }
        }
        
        keysToDelete.forEach(key => this.redis.cache.delete(key));
        logger.info(`Memory cache invalidated: ${keysToDelete.length} keys matching ${pattern}`);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache invalidation error:', { error: error.message, pattern });
      return false;
    }
  }

  matchesPattern(key, pattern) {
    // Simple pattern matching for wildcards
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * Cache-aside pattern with automatic population
   */
  async getOrSet(key, fetchFunction, type = 'default', customTTL = null) {
    try {
      // Try to get from cache first
      let value = await this.get(key, type);
      
      if (value !== null) {
        logger.debug(`Cache hit for getOrSet: ${key}`);
        return value;
      }

      // Cache miss - fetch data
      logger.debug(`Cache miss for getOrSet: ${key}, fetching data...`);
      const startTime = Date.now();
      value = await fetchFunction();
      const fetchTime = Date.now() - startTime;
      
      logger.debug(`Data fetched in ${fetchTime}ms for key: ${key}`);

      // Store in cache
      if (value !== null && value !== undefined) {
        await this.set(key, value, type, customTTL);
        logger.debug(`Data cached for key: ${key}`);
      }

      return value;
    } catch (error) {
      logger.error('Cache getOrSet error:', { error: error.message, key, type });
      // Return null on cache errors, let the application handle it
      return null;
    }
  }

  /**
   * Batch operations for high-volume scenarios
   */
  async mget(keys) {
    try {
      logger.debug(`Cache MGET: ${keys.length} keys`);
      
      if (this.redis.client) {
        const values = await this.redis.client.mget(...keys);
        return keys.map((key, index) => ({
          key,
          value: values[index] ? JSON.parse(values[index]) : null
        }));
      } else {
        // In-memory batch get
        return keys.map(key => ({
          key,
          value: this.redis.cache.get(key) || null
        }));
      }
    } catch (error) {
      logger.error('Cache MGET error:', { error: error.message, keyCount: keys.length });
      return keys.map(key => ({ key, value: null }));
    }
  }

  async mset(keyValuePairs, type = 'default', customTTL = null) {
    try {
      const ttl = customTTL || this.defaultTTL[type] || this.defaultTTL.default;
      logger.debug(`Cache MSET: ${keyValuePairs.length} pairs (TTL: ${ttl}s)`);

      if (this.redis.client) {
        // Redis pipeline for batch operations
        const pipeline = this.redis.client.pipeline();
        
        keyValuePairs.forEach(({ key, value }) => {
          pipeline.setex(key, ttl, JSON.stringify(value));
        });
        
        await pipeline.exec();
      } else {
        // In-memory batch set
        keyValuePairs.forEach(({ key, value }) => {
          this.redis.cache.set(key, value);
          // Simulate TTL
          setTimeout(() => {
            this.redis.cache.delete(key);
          }, ttl * 1000);
        });
      }

      logger.debug(`Cache MSET successful: ${keyValuePairs.length} pairs`);
      return true;
    } catch (error) {
      logger.error('Cache MSET error:', { error: error.message, pairCount: keyValuePairs.length });
      return false;
    }
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmCache() {
    logger.info('🔥 Starting cache warming process...');
    
    try {
      // Warm popular routes
      const popularRoutes = [
        { origin: 'DEL', destination: 'BLR' },
        { origin: 'NYC', destination: 'LAX' },
        { origin: 'DEL', destination: 'BOM' },
        { origin: 'BOM', destination: 'BLR' }
      ];

      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      for (const route of popularRoutes) {
        for (const date of [today, tomorrow]) {
          const cacheKey = `routes:${route.origin}:${route.destination}:${date}`;
          
          // Check if already cached
          const cached = await this.get(cacheKey, 'routes');
          if (!cached) {
            logger.debug(`Warming cache for route: ${route.origin} → ${route.destination} on ${date}`);
            // This would trigger route computation and caching
            // Implementation depends on your route service
          }
        }
      }

      logger.info('✅ Cache warming completed');
    } catch (error) {
      logger.error('Cache warming error:', { error: error.message });
    }
  }

  /**
   * Cache statistics and monitoring
   */
  async getStats() {
    try {
      if (this.redis.client) {
        const info = await this.redis.client.info('memory');
        const keyspace = await this.redis.client.info('keyspace');
        
        return {
          type: 'redis',
          memory: this.parseRedisInfo(info),
          keyspace: this.parseRedisInfo(keyspace),
          connected: this.redis.isConnected
        };
      } else {
        return {
          type: 'memory',
          size: this.redis.cache.size,
          keys: Array.from(this.redis.cache.keys()),
          connected: true
        };
      }
    } catch (error) {
      logger.error('Cache stats error:', { error: error.message });
      return { error: error.message };
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    });
    
    return result;
  }
}

export const cacheService = new CacheService();