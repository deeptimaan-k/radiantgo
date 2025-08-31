import { redisService } from '../services/redisService.js';
import logger from '../utils/logger.js';

export class DistributedLock {
  constructor(redisClient = redisService) {
    this.redis = redisClient;
    this.defaultTTL = 30; // 30 seconds default lock TTL
    this.retryDelay = 100; // 100ms between retries
    this.maxRetries = 50; // Maximum retry attempts
  }

  /**
   * Acquire a distributed lock with automatic retry and exponential backoff
   */
  async acquire(lockKey, ttlSeconds = this.defaultTTL, maxRetries = this.maxRetries) {
    const lockValue = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullKey = `lock:${lockKey}`;
    
    logger.debug(`Attempting to acquire distributed lock: ${lockKey}`, { 
      ttlSeconds, 
      maxRetries,
      lockValue 
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const acquired = await this.redis.acquireLock(lockKey, ttlSeconds);
        
        if (acquired) {
          logger.info(`✅ Distributed lock acquired: ${lockKey}`, { 
            attempt,
            lockValue: acquired,
            ttlSeconds 
          });
          return {
            lockKey,
            lockValue: acquired,
            ttl: ttlSeconds,
            acquiredAt: new Date().toISOString()
          };
        }

        // Exponential backoff with jitter
        const delay = Math.min(this.retryDelay * Math.pow(1.5, attempt - 1), 2000);
        const jitter = Math.random() * 100;
        const totalDelay = delay + jitter;

        logger.debug(`Lock acquisition attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(totalDelay)}ms`, { 
          lockKey,
          attempt,
          delay: totalDelay 
        });

        await new Promise(resolve => setTimeout(resolve, totalDelay));
      } catch (error) {
        logger.error(`Lock acquisition error on attempt ${attempt}:`, { 
          error: error.message,
          lockKey,
          attempt 
        });
        
        if (attempt === maxRetries) {
          throw new LockAcquisitionError(lockKey, maxRetries);
        }
      }
    }

    logger.warn(`❌ Failed to acquire lock after ${maxRetries} attempts: ${lockKey}`);
    throw new LockAcquisitionError(lockKey, maxRetries);
  }

  /**
   * Release a distributed lock safely
   */
  async release(lockInfo) {
    if (!lockInfo || !lockInfo.lockKey || !lockInfo.lockValue) {
      logger.warn('Invalid lock info provided for release', { lockInfo });
      return false;
    }

    logger.debug(`Releasing distributed lock: ${lockInfo.lockKey}`, { 
      lockValue: lockInfo.lockValue 
    });

    try {
      const released = await this.redis.releaseLock(lockInfo.lockKey, lockInfo.lockValue);
      
      if (released) {
        logger.info(`✅ Distributed lock released: ${lockInfo.lockKey}`, { 
          lockValue: lockInfo.lockValue,
          heldDuration: Date.now() - new Date(lockInfo.acquiredAt).getTime()
        });
      } else {
        logger.warn(`⚠️ Lock release failed (may have expired): ${lockInfo.lockKey}`, { 
          lockValue: lockInfo.lockValue 
        });
      }
      
      return released;
    } catch (error) {
      logger.error('Lock release error:', { 
        error: error.message,
        lockKey: lockInfo.lockKey,
        lockValue: lockInfo.lockValue 
      });
      return false;
    }
  }

  /**
   * Execute a function with automatic lock acquisition and release
   */
  async withLock(lockKey, fn, ttlSeconds = this.defaultTTL) {
    let lockInfo = null;
    
    try {
      lockInfo = await this.acquire(lockKey, ttlSeconds);
      logger.debug(`Executing function with lock: ${lockKey}`);
      
      const result = await fn();
      
      logger.debug(`Function execution completed with lock: ${lockKey}`);
      return result;
    } finally {
      if (lockInfo) {
        await this.release(lockInfo);
      }
    }
  }

  /**
   * Check if a lock exists without acquiring it
   */
  async exists(lockKey) {
    try {
      const value = await this.redis.get(`lock:${lockKey}`);
      const exists = value !== null;
      logger.debug(`Lock existence check: ${lockKey} = ${exists}`);
      return exists;
    } catch (error) {
      logger.error('Lock existence check error:', { error: error.message, lockKey });
      return false;
    }
  }

  /**
   * Extend lock TTL if still owned
   */
  async extend(lockInfo, additionalSeconds) {
    if (!lockInfo || !lockInfo.lockKey || !lockInfo.lockValue) {
      return false;
    }

    logger.debug(`Extending lock TTL: ${lockInfo.lockKey}`, { 
      additionalSeconds,
      currentTTL: lockInfo.ttl 
    });

    try {
      // Check if we still own the lock
      const currentValue = await this.redis.get(`lock:${lockInfo.lockKey}`);
      if (currentValue !== lockInfo.lockValue) {
        logger.warn(`Cannot extend lock - ownership changed: ${lockInfo.lockKey}`);
        return false;
      }

      // Extend the TTL
      const newTTL = lockInfo.ttl + additionalSeconds;
      const extended = await this.redis.set(
        `lock:${lockInfo.lockKey}`, 
        lockInfo.lockValue, 
        newTTL
      );

      if (extended) {
        lockInfo.ttl = newTTL;
        logger.info(`✅ Lock TTL extended: ${lockInfo.lockKey}`, { newTTL });
      }

      return extended;
    } catch (error) {
      logger.error('Lock extension error:', { 
        error: error.message,
        lockKey: lockInfo.lockKey 
      });
      return false;
    }
  }
}

// Custom error for lock acquisition failures
export class LockAcquisitionError extends Error {
  constructor(lockKey, maxRetries) {
    super(`Failed to acquire lock '${lockKey}' after ${maxRetries} attempts`);
    this.name = 'LockAcquisitionError';
    this.lockKey = lockKey;
    this.maxRetries = maxRetries;
    this.status = 409;
    this.title = 'Resource Locked';
  }
}

// Middleware factory for route-level locking
export const withDistributedLock = (getLockKey, ttlSeconds = 30) => {
  const lockManager = new DistributedLock();
  
  return async (req, res, next) => {
    const lockKey = typeof getLockKey === 'function' ? getLockKey(req) : getLockKey;
    
    logger.debug(`Middleware attempting distributed lock: ${lockKey}`, { 
      requestId: req.id,
      method: req.method,
      url: req.originalUrl 
    });

    try {
      const lockInfo = await lockManager.acquire(lockKey, ttlSeconds);
      
      // Store lock info for cleanup
      req.distributedLock = lockInfo;
      
      // Ensure lock is released on response
      const originalSend = res.send;
      res.send = function(data) {
        lockManager.release(lockInfo).catch(error => {
          logger.error('Failed to release lock on response:', { 
            error: error.message,
            lockKey: lockInfo.lockKey 
          });
        });
        return originalSend.call(this, data);
      };

      // Handle request abort/timeout
      req.on('close', () => {
        if (req.distributedLock) {
          logger.debug(`Releasing lock on request close: ${lockKey}`, { requestId: req.id });
          lockManager.release(req.distributedLock).catch(error => {
            logger.error('Failed to release lock on request close:', { 
              error: error.message,
              lockKey 
            });
          });
        }
      });

      next();
    } catch (error) {
      if (error instanceof LockAcquisitionError) {
        logger.warn(`Lock acquisition timeout: ${lockKey}`, { 
          requestId: req.id,
          maxRetries: error.maxRetries 
        });
        
        return res.status(409).json({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.8',
          title: 'Resource Temporarily Locked',
          status: 409,
          detail: `The booking is currently being processed by another request. Please try again in a few seconds.`,
          instance: req.originalUrl,
          retryAfter: 5,
          lockKey: lockKey
        });
      }
      
      logger.error('Distributed lock middleware error:', { 
        error: error.message,
        lockKey,
        requestId: req.id 
      });
      next(error);
    }
  };
};

// Lock key generators for different resources
export const lockKeys = {
  booking: (req) => `booking:${req.params.id}`,
  bookingByRef: (req) => `booking:ref:${req.params.ref_id}`,
  bookingStatus: (req) => `booking:status:${req.params.ref_id}`,
  flight: (req) => `flight:${req.params.id}`,
  user: (req) => `user:${req.params.id}`,
  routeSearch: (req) => `route:${req.query.origin}:${req.query.destination}:${req.query.date}`
};

export const distributedLock = new DistributedLock();