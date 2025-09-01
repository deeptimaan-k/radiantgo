import rateLimit from 'express-rate-limit';

export const createRateLimit = () => {
  return rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
    message: {
      type: 'https://radiantgo.com/errors/RATE_LIMIT_EXCEEDED',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};