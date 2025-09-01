import { CacheService } from '../../utils/cache';
import { redisClient } from '../../utils/redis';

const cacheService = new CacheService();

describe('CacheService', () => {
  beforeEach(async () => {
    // Clear Redis before each test
    try {
      await redisClient.getClient().flushAll();
    } catch (error) {
      console.warn('Redis not available for testing');
    }
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const key = 'test:key';
      const value = { test: 'data' };

      await cacheService.set(key, value, 60);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non:existent');
      expect(result).toBeNull();
    });

    it('should delete keys', async () => {
      const key = 'test:delete';
      const value = { test: 'data' };

      await cacheService.set(key, value);
      await cacheService.del(key);
      
      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test:exists';
      const value = { test: 'data' };

      expect(await cacheService.exists(key)).toBe(false);
      
      await cacheService.set(key, value);
      expect(await cacheService.exists(key)).toBe(true);
    });
  });

  describe('Key Generation', () => {
    it('should generate booking cache key', () => {
      const key = cacheService.generateBookingKey('RG12345678');
      expect(key).toBe('booking:RG12345678');
    });

    it('should generate route cache key', () => {
      const key = cacheService.generateRouteKey('DEL', 'BOM', '2024-01-15');
      expect(key).toBe('routes:DEL:BOM:2024-01-15');
    });

    it('should generate idempotency key', () => {
      const key = cacheService.generateIdempotencyKey('unique-key-123');
      expect(key).toBe('idempotency:unique-key-123');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // This test assumes Redis might not be available
      const result = await cacheService.get('test:key');
      expect(result).toBeNull(); // Should not throw error
    });
  });
});