import logger from './logger';

export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      logger.warn(`Timer ${label} was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);
    
    logger.debug(`Performance: ${label} took ${duration}ms`);
    return duration;
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(label);
    try {
      const result = await fn();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }

  static measure<T>(label: string, fn: () => T): T {
    this.startTimer(label);
    try {
      const result = fn();
      this.endTimer(label);
      return result;
    } catch (error) {
      this.endTimer(label);
      throw error;
    }
  }
}

export const withPerformanceLogging = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const label = `${target.constructor.name}.${propertyName}`;
    return PerformanceMonitor.measureAsync(label, () => method.apply(this, args));
  };

  return descriptor;
};