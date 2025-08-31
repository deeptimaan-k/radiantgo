import logger from '../utils/logger.js';

// RFC 7807 Problem Details for HTTP APIs
export const errorHandler = (err, req, res, next) => {
  logger.error('Request error occurred:', {
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Default error response
  let problemDetails = {
    type: 'https://tools.ietf.org/html/rfc7231#section-6.6.1',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
    instance: req.originalUrl
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    logger.warn('Validation error:', { 
      error: err.message, 
      requestId: req.id 
    });
    problemDetails = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
      title: 'Validation Error',
      status: 400,
      detail: err.message,
      instance: req.originalUrl
    };
  } else if (err.name === 'CastError') {
    logger.warn('Cast error (invalid ID format):', { 
      error: err.message, 
      requestId: req.id 
    });
    problemDetails = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
      title: 'Invalid ID Format',
      status: 400,
      detail: 'The provided ID is not in a valid format',
      instance: req.originalUrl
    };
  } else if (err.code === 11000) {
    logger.warn('Duplicate key error:', { 
      error: err.message, 
      requestId: req.id 
    });
    problemDetails = {
      type: 'https://tools.ietf.org/html/rfc7231#section-6.5.9',
      title: 'Duplicate Resource',
      status: 409,
      detail: 'A resource with this identifier already exists',
      instance: req.originalUrl
    };
  } else if (err.status) {
    logger.warn('Custom error with status:', { 
      status: err.status,
      title: err.title,
      message: err.message,
      requestId: req.id 
    });
    problemDetails.status = err.status;
    problemDetails.title = err.title || getStatusText(err.status);
    problemDetails.detail = err.message;
  }

  // Add timestamp
  problemDetails.timestamp = new Date().toISOString();
  
  // Add request ID for tracing
  if (req.id) {
    problemDetails.requestId = req.id;
  }
  
  logger.info('Sending error response:', { 
    status: problemDetails.status,
    title: problemDetails.title,
    requestId: req.id 
  });

  res.status(problemDetails.status).json(problemDetails);
};

// Custom error classes
export class BookingError extends Error {
  constructor(message, status = 400, title = 'Booking Error') {
    super(message);
    this.name = 'BookingError';
    this.status = status;
    this.title = title;
  }
}

export class StatusTransitionError extends BookingError {
  constructor(currentStatus, targetStatus) {
    super(`Cannot transition from ${currentStatus} to ${targetStatus}`);
    this.title = 'Invalid Status Transition';
    this.status = 422;
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.status = 404;
    this.title = 'Not Found';
  }
}

function getStatusText(status) {
  const statusTexts = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error'
  };
  return statusTexts[status] || 'Error';
}