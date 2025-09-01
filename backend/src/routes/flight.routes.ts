import { Router } from 'express';
import Joi from 'joi';
import { flightController } from '../controllers/flight.controller';
import { authenticate } from '../middlewares/auth';
import { validateQuery } from '../middlewares/validate';

const router = Router();

// Validation schemas
const routeSearchSchema = Joi.object({
  origin: Joi.string().length(3).pattern(/^[A-Z]{3}$/).required()
    .messages({
      'string.length': 'Origin must be exactly 3 characters',
      'string.pattern.base': 'Origin must be a valid IATA code (3 uppercase letters)'
    }),
  destination: Joi.string().length(3).pattern(/^[A-Z]{3}$/).required()
    .messages({
      'string.length': 'Destination must be exactly 3 characters',
      'string.pattern.base': 'Destination must be a valid IATA code (3 uppercase letters)'
    }),
  departure_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
    .messages({
      'string.pattern.base': 'Date must be in YYYY-MM-DD format'
    })
});

const flightSearchSchema = Joi.object({
  origin: Joi.string().length(3).pattern(/^[A-Z]{3}$/).required(),
  destination: Joi.string().length(3).pattern(/^[A-Z]{3}$/).required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
});

// Routes
router.get(
  '/routes',
  authenticate,
  validateQuery(routeSearchSchema),
  flightController.getRoutes
);

router.get(
  '/route',
  authenticate,
  validateQuery(flightSearchSchema),
  flightController.searchFlights
);

router.get('/:flightId', authenticate, flightController.getFlightById);

export default router;