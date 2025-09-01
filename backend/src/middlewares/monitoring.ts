import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface RequestMetrics {
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip: string;
  timestamp: Date;
}

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    const metrics: RequestMetrics = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      timestamp: new Date()
    };

    // Log slow requests (>1000ms)
    if (responseTime > 1000) {
      logger.warn('Slow request detected:', metrics);
    }

    // Log error responses
    if (res.statusCode >= 400) {
      logger.warn('Error response:', metrics);
    }

    // Log successful requests at debug level
    if (res.statusCode < 400) {
      logger.debug('Request completed:', metrics);
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};