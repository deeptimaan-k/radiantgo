import { createClient, RedisClientType } from 'redis';
import logger from './logger';

class RedisClient {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > this.maxReconnectAttempts) {
            logger.error('Max Redis reconnection attempts reached');
            return false;
          }
          return Math.min(retries * 50, 500);
        }
      }
    });

    this.client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis Client Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.info(`Redis reconnecting... Attempt ${this.reconnectAttempts}`);
    });

    this.client.on('ready', () => {
      logger.info('Redis Client Ready');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected && !this.client.isOpen) {
      try {
        await this.client.connect();
      } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        // Don't throw error - allow app to continue without Redis
        logger.warn('Continuing without Redis cache');
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected && this.client.isOpen) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.warn(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.warn(`Redis SET error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.warn(`Redis DEL error for key ${key}:`, error);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.warn(`Redis EXISTS error for key ${key}:`, error);
      return 0;
    }
  }

  async setNX(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      const result = await this.client.set(key, value, {
        NX: true,
        EX: ttl
      });
      return result === 'OK';
    } catch (error) {
      logger.warn(`Redis SETNX error for key ${key}:`, error);
      return false;
    }
  }

  async acquireLock(lockKey: string, ttl: number = 30): Promise<boolean> {
    return await this.setNX(lockKey, 'locked', ttl);
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.del(lockKey);
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected && this.client.isOpen;
  }
}

export const redisClient = new RedisClient();