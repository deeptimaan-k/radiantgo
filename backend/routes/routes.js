import express from 'express';
import logger from '../utils/logger.js';
import { routeService } from '../services/routeService.js';
import { validateQuery, schemas } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for route searches
const routeSearchLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    type: 'https://tools.ietf.org/html/rfc6585#section-4',
    title: 'Too Many Requests',
    status: 429,
    detail: 'Too many route search requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// GET /api/routes?origin=DEL&destination=BLR&date=YYYY-MM-DD
router.get('/', 
  routeSearchLimit,
  validateQuery(schemas.routeQuery),
  async (req, res) => {
    try {
      const { origin, destination, date } = req.validatedQuery;
      
      logger.info(`Route search requested`, { 
        requestId: req.id,
        origin, 
        destination, 
        date,
        userAgent: req.get('User-Agent')
      });
      
      // Validate that origin and destination are different
      if (origin === destination) {
        logger.warn(`Invalid route search - same origin and destination: ${origin}`, { requestId: req.id });
        return res.status(400).json({
          type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
          title: 'Invalid Route',
          status: 400,
          detail: 'Origin and destination cannot be the same',
          instance: req.originalUrl
        });
      }

      const startTime = Date.now();
      const routes = await routeService.findRoutes(origin, destination, date);
      const searchDuration = Date.now() - startTime;
      
      logger.info(`Route search completed`, { 
        requestId: req.id,
        origin, 
        destination, 
        date,
        directRoutes: routes.direct.length,
        oneHopRoutes: routes.oneHop.length,
        searchDurationMs: searchDuration,
        cached: routes.generatedAt !== new Date().toISOString()
      });
      
      // Add metadata
      const response = {
        ...routes,
        meta: {
          totalDirectRoutes: routes.direct.length,
          totalOneHopRoutes: routes.oneHop.length,
          searchTime: new Date().toISOString(),
          cached: routes.generatedAt !== new Date().toISOString(),
          searchDurationMs: searchDuration
        }
      };

      res.json(response);
    } catch (error) {
      logger.error('Route search error:', { 
        error: error.message, 
        stack: error.stack,
        query: req.validatedQuery,
        requestId: req.id 
      });
      res.status(500).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
        title: 'Route Search Failed',
        status: 500,
        detail: 'Unable to search for routes at this time',
        instance: req.originalUrl
      });
    }
  }
);

export { router as routeRoutes };