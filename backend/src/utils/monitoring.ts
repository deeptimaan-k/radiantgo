import logger from './logger';

export interface SystemMetrics {
  timestamp: Date;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  activeConnections?: number;
}

export class SystemMonitor {
  private static instance: SystemMonitor;
  private metricsInterval?: NodeJS.Timeout;

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  startMonitoring(intervalMs: number = 60000): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    logger.info('System monitoring started');
  }

  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
      logger.info('System monitoring stopped');
    }
  }

  private collectMetrics(): void {
    const memUsage = process.memoryUsage();
    const metrics: SystemMetrics = {
      timestamp: new Date(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      uptime: process.uptime()
    };

    // Log warning if memory usage is high
    if (metrics.memory.percentage > 80) {
      logger.warn('High memory usage detected:', metrics);
    }

    logger.debug('System metrics:', metrics);
  }

  getMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    return {
      timestamp: new Date(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      uptime: process.uptime()
    };
  }
}

export const systemMonitor = SystemMonitor.getInstance();