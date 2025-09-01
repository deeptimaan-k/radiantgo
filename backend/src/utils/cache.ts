import { redisClient } from './redis';
import logger from './logger';

export class CacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!redisClient.isClientConnected()) {
        logger.debug(`Cache unavailable for key: ${key}`);
        return null;
      }

      const cached = await redisClient.get(key);
      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.warn(`Cache read error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      if (!redisClient.isClientConnected()) {
        logger.debug(`Cache unavailable for set: ${key}`);
        return;
      }

      await redisClient.set(key, JSON.stringify(value), ttl);
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.warn(`Cache write error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!redisClient.isClientConnected()) {
        logger.debug(`Cache unavailable for delete: ${key}`);
        return;
      }

      await redisClient.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!redisClient.isClientConnected()) {
        return false;
      }

      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.warn(`Cache exists check error for key ${key}:`, error);
      return false;
    }
  }

  // Utility methods for common cache patterns
  generateBookingKey(refId: string): string {
    return `booking:${refId}`;
  }

  generateRouteKey(origin: string, destination: string, date: string): string {
    return `routes:${origin}:${destination}:${date}`;
  }

  generateIdempotencyKey(key: string): string {
    return `idempotency:${key}`;
  }
}

export const cacheService = new CacheService();