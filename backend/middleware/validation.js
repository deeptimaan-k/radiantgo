import Joi from 'joi';

// Validation schemas
export const schemas = {
  createBooking: Joi.object({
    origin: Joi.string().length(3).uppercase().required(),
    destination: Joi.string().length(3).uppercase().required(),
    pieces: Joi.number().integer().min(1).max(1000).required(),
    weight_kg: Joi.number().positive().max(10000).required(),
    customer_name: Joi.string().min(2).max(100).optional(),
    customer_email: Joi.string().email().optional()
  }),

  routeQuery: Joi.object({
    origin: Joi.string().length(3).uppercase().required(),
    destination: Joi.string().length(3).uppercase().required(),
    date: Joi.date().iso().min('now').required()
  }),

  statusUpdate: Joi.object({
    location: Joi.string().min(3).max(100).optional(),
    flight_id: Joi.string().optional(),
    notes: Joi.string().max(500).optional()
  }),

  bulkBookings: Joi.object({
    bookings: Joi.array().items(
      Joi.object({
        origin: Joi.string().length(3).uppercase().required(),
        destination: Joi.string().length(3).uppercase().required(),
        pieces: Joi.number().integer().min(1).max(1000).required(),
        weight_kg: Joi.number().positive().max(10000).required(),
        customer_name: Joi.string().min(2).max(100).optional(),
        customer_email: Joi.string().email().optional()
      })
    ).min(1).max(1000).required()
  }),

  bulkStatusUpdates: Joi.object({
    updates: Joi.array().items(
      Joi.object({
        ref_id: Joi.string().required(),
        newStatus: Joi.string().valid('BOOKED', 'DEPARTED', 'ARRIVED', 'DELIVERED', 'CANCELLED').required(),
        eventData: Joi.object({
          location: Joi.string().min(3).max(100).optional(),
          flight_id: Joi.string().optional(),
          notes: Joi.string().max(500).optional()
        }).optional()
      })
    ).min(1).max(500).required()
  }),

  bulkFlights: Joi.object({
    flights: Joi.array().items(
      Joi.object({
        flight_number: Joi.string().required(),
        airline: Joi.string().required(),
        origin: Joi.string().length(3).uppercase().required(),
        destination: Joi.string().length(3).uppercase().required(),
        departure_ts: Joi.date().iso().required(),
        arrival_ts: Joi.date().iso().required()
      })
    ).min(1).max(2000).required()
  })
};

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Validation Error',
        status: 400,
        detail: error.details[0].message,
        instance: req.originalUrl,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedBody = value;
    next();
  };
};

// Query validation middleware
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
        title: 'Query Validation Error',
        status: 400,
        detail: error.details[0].message,
        instance: req.originalUrl,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};