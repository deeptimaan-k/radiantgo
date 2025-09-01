import mongoose from 'mongoose';
import { redisClient } from './redis';
import { systemMonitor } from './monitoring';
import logger from './logger';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    mongodb: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      responseTime?: number;
    };
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export class HealthChecker {
  async checkHealth(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    // Check MongoDB
    const mongoStatus = await this.checkMongoDB();
    
    // Check Redis
    const redisStatus = await this.checkRedis();
    
    // Get system metrics
    const systemMetrics = systemMonitor.getMetrics();
    
    // Determine overall health
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (mongoStatus.status === 'disconnected') {
      overallStatus = 'unhealthy';
    } else if (redisStatus.status === 'disconnected' || systemMetrics.memory.percentage > 90) {
      overallStatus = 'degraded';
    }

    const health: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus
      },
      system: {
        memory: systemMetrics.memory
      }
    };

    logger.debug('Health check completed:', health);
    return health;
  }

  private async checkMongoDB(): Promise<{ status: 'connected' | 'disconnected'; responseTime?: number }> {
    try {
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime
      };
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
      return { status: 'disconnected' };
    }
  }

  private async checkRedis(): Promise<{ status: 'connected' | 'disconnected'; responseTime?: number }> {
    try {
      const startTime = Date.now();
      await redisClient.getClient().ping();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'connected',
        responseTime
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { status: 'disconnected' };
    }
  }
}

export const healthChecker = new HealthChecker();