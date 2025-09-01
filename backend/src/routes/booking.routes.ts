import { Router } from 'express';
import Joi from 'joi';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth';
import { validate, validateParams } from '../middlewares/validate';

const router = Router();

// Validation schemas
const createBookingSchema = Joi.object({
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
  pieces: Joi.number().integer().min(1).required()
    .messages({
      'number.min': 'Pieces must be at least 1'
    }),
  weight_kg: Joi.number().positive().required()
    .messages({
      'number.positive': 'Weight must be a positive number'
    }),
  route_id: Joi.string().required()
    .messages({
      'any.required': 'Route ID is required'
    }),
  departure_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
    .messages({
      'string.pattern.base': 'Departure date must be in YYYY-MM-DD format'
    })
});

const getBookingParamsSchema = Joi.object({
  ref_id: Joi.string().required()
});

const statusUpdateSchema = Joi.object({
  location: Joi.string().optional(),
  flight_info: Joi.object({
    flight_number: Joi.string().optional(),
    airline: Joi.string().optional()
  }).optional(),
  meta: Joi.object().optional(),
  reason: Joi.string().optional()
});

// Routes
router.post(
  '/',
  authenticate,
  validate(createBookingSchema),
  bookingController.createBooking
);

router.get(
  '/',
  authenticate,
  bookingController.getAllBookings
);

router.get(
  '/:ref_id',
  authenticate,
  validateParams(getBookingParamsSchema),
  bookingController.getBooking
);

router.post(
  '/:ref_id/depart',
  authenticate,
  validateParams(getBookingParamsSchema),
  validate(statusUpdateSchema),
  bookingController.departBooking
);

router.post(
  '/:ref_id/arrive',
  authenticate,
  validateParams(getBookingParamsSchema),
  validate(statusUpdateSchema),
  bookingController.arriveBooking
);

router.post(
  '/:ref_id/deliver',
  authenticate,
  validateParams(getBookingParamsSchema),
  validate(statusUpdateSchema),
  bookingController.deliverBooking
);

router.post(
  '/:ref_id/cancel',
  authenticate,
  validateParams(getBookingParamsSchema),
  validate(statusUpdateSchema),
  bookingController.cancelBooking
);

export default router;