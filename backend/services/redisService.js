import Redis from 'ioredis';
import logger from '../utils/logger.js';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.cache = new Map(); // Fallback in-memory cache for WebContainer
  }

  async connect() {
    try {
      // In WebContainer, we'll use in-memory cache
      // In production, this would connect to actual Redis
      if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
        logger.info('Connecting to Redis...', { url: process.env.REDIS_URL });
        this.client = new Redis(process.env.REDIS_URL);
        this.isConnected = true;
        logger.info('✅ Connected to Redis');
      } else {
        logger.info('📝 Using in-memory cache (WebContainer mode)');
        this.isConnected = true;
      }
    } catch (error) {
      logger.error('❌ Redis connection failed:', { error: error.message });
      this.isConnected = false;
    }
  }

  async get(key) {
    try {
      logger.debug(`Redis GET: ${key}`);
      if (this.client) {
        const value = await this.client.get(key);
        logger.debug(`Redis GET result: ${key} = ${value ? 'HIT' : 'MISS'}`);
        return value ? JSON.parse(value) : null;
      } else {
        const hasValue = this.cache.has(key);
        logger.debug(`Memory cache GET: ${key} = ${hasValue ? 'HIT' : 'MISS'}`);
        return this.cache.get(key) || null;
      }
    } catch (error) {
      logger.error('Redis GET error:', { error: error.message, key });
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      logger.debug(`Redis SET: ${key} (TTL: ${ttlSeconds}s)`);
      const serialized = JSON.stringify(value);
      
      if (this.client) {
        await this.client.setex(key, ttlSeconds, serialized);
        logger.debug(`Redis SET successful: ${key}`);
      } else {
        this.cache.set(key, value);
        logger.debug(`Memory cache SET: ${key} (TTL: ${ttlSeconds}s)`);
        // Simulate TTL with setTimeout
        setTimeout(() => {
          logger.debug(`Memory cache TTL expired: ${key}`);
          this.cache.delete(key);
        }, ttlSeconds * 1000);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', { error: error.message, key, ttlSeconds });
      return false;
    }
  }

  async del(key) {
    try {
      logger.debug(`Redis DEL: ${key}`);
      if (this.client) {
        await this.client.del(key);
      } else {
        this.cache.delete(key);
      }
      logger.debug(`Redis DEL successful: ${key}`);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', { error: error.message, key });
      return false;
    }
  }

  // Distributed locking
  async acquireLock(lockKey, ttlSeconds = 30) {
    const lockValue = `${Date.now()}-${Math.random()}`;
    const key = `lock:${lockKey}`;
    
    logger.debug(`Attempting to acquire lock: ${lockKey}`, { ttlSeconds });
    
    try {
      if (this.client) {
        const result = await this.client.set(key, lockValue, 'EX', ttlSeconds, 'NX');
        const acquired = result === 'OK';
        logger.debug(`Lock acquisition ${acquired ? 'successful' : 'failed'}: ${lockKey}`, { lockValue });
        return acquired ? lockValue : null;
      } else {
        // In-memory lock simulation
        if (!this.cache.has(key)) {
          this.cache.set(key, lockValue);
          logger.debug(`Memory lock acquired: ${lockKey}`, { lockValue, ttlSeconds });
          setTimeout(() => {
            if (this.cache.get(key) === lockValue) {
              logger.debug(`Memory lock expired: ${lockKey}`);
              this.cache.delete(key);
            }
          }, ttlSeconds * 1000);
          return lockValue;
        }
        logger.debug(`Memory lock acquisition failed: ${lockKey} (already locked)`);
        return null;
      }
    } catch (error) {
      logger.error('Lock acquisition error:', { error: error.message, lockKey });
      return null;
    }
  }

  async releaseLock(lockKey, lockValue) {
    const key = `lock:${lockKey}`;
    
    logger.debug(`Releasing lock: ${lockKey}`, { lockValue });
    
    try {
      if (this.client) {
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const result = await this.client.eval(script, 1, key, lockValue);
        const released = result === 1;
        logger.debug(`Lock release ${released ? 'successful' : 'failed'}: ${lockKey}`);
        return released;
      } else {
        if (this.cache.get(key) === lockValue) {
          this.cache.delete(key);
          logger.debug(`Memory lock released: ${lockKey}`);
          return true;
        }
        logger.debug(`Memory lock release failed: ${lockKey} (value mismatch or not found)`);
        return false;
      }
    } catch (error) {
      logger.error('Lock release error:', { error: error.message, lockKey });
      return false;
    }
  }

  async disconnect() {
    logger.info('Disconnecting from Redis...');
    if (this.client) {
      await this.client.quit();
      logger.info('Redis connection closed');
    }
    this.cache.clear();
    logger.debug('Memory cache cleared');
    this.isConnected = false;
  }
}

export const redisService = new RedisService();