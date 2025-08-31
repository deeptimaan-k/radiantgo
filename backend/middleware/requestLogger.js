import morgan from 'morgan';
import logger from '../utils/logger.js';

// Custom token for request ID
morgan.token('id', (req) => req.id);

// Custom token for user info (if available)
morgan.token('user', (req) => {
  return req.user ? req.user.email : 'anonymous';
});

// Custom token for response time in different color
morgan.token('colored-response-time', (req, res) => {
  const responseTime = morgan['response-time'](req, res);
  const time = parseFloat(responseTime);
  
  if (time < 100) return `\x1b[32m${responseTime}ms\x1b[0m`; // Green for fast
  if (time < 500) return `\x1b[33m${responseTime}ms\x1b[0m`; // Yellow for medium
  return `\x1b[31m${responseTime}ms\x1b[0m`; // Red for slow
});

// Development format with colors
const developmentFormat = ':method :url :status :colored-response-time - :res[content-length] bytes';

// Production format with more details
const productionFormat = ':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Create morgan middleware
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  {
    stream: {
      write: (message) => {
        // Remove trailing newline and log through winston
        logger.http(message.trim());
      },
    },
    // Skip logging for health checks in production
    skip: (req) => {
      return process.env.NODE_ENV === 'production' && req.url === '/health';
    }
  }
);

// Request ID middleware for tracing
export const addRequestId = (req, res, next) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Log request body for debugging (development only)
export const logRequestBody = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
    logger.debug(`Request body for ${req.method} ${req.url}:`, {
      requestId: req.id,
      body: req.body
    });
  }
  next();
};