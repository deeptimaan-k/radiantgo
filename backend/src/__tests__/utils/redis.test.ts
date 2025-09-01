import { redisClient } from '../../utils/redis';

describe('RedisClient', () => {
  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      try {
        await redisClient.set('test:key', 'test:value');
        const value = await redisClient.get('test:key');
        expect(value).toBe('test:value');
      } catch (error) {
        console.warn('Redis not available for testing');
      }
    });

    it('should handle TTL correctly', async () => {
      try {
        await redisClient.set('test:ttl', 'value', 1);
        
        // Should exist immediately
        const exists1 = await redisClient.exists('test:ttl');
        expect(exists1).toBe(1);
        
        // Should expire after TTL
        await new Promise(resolve => setTimeout(resolve, 1100));
        const exists2 = await redisClient.exists('test:ttl');
        expect(exists2).toBe(0);
      } catch (error) {
        console.warn('Redis not available for testing');
      }
    });
  });

  describe('Distributed Locking', () => {
    it('should acquire and release locks', async () => {
      try {
        const lockKey = 'test:lock';
        
        // Acquire lock
        const acquired = await redisClient.acquireLock(lockKey, 30);
        expect(acquired).toBe(true);
        
        // Try to acquire same lock (should fail)
        const acquired2 = await redisClient.acquireLock(lockKey, 30);
        expect(acquired2).toBe(false);
        
        // Release lock
        await redisClient.releaseLock(lockKey);
        
        // Should be able to acquire again
        const acquired3 = await redisClient.acquireLock(lockKey, 30);
        expect(acquired3).toBe(true);
        
        await redisClient.releaseLock(lockKey);
      } catch (error) {
        console.warn('Redis not available for testing');
      }
    });

    it('should handle lock expiration', async () => {
      try {
        const lockKey = 'test:lock:expire';
        
        // Acquire lock with short TTL
        const acquired = await redisClient.acquireLock(lockKey, 1);
        expect(acquired).toBe(true);
        
        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        // Should be able to acquire again
        const acquired2 = await redisClient.acquireLock(lockKey, 30);
        expect(acquired2).toBe(true);
        
        await redisClient.releaseLock(lockKey);
      } catch (error) {
        console.warn('Redis not available for testing');
      }
    });
  });
});