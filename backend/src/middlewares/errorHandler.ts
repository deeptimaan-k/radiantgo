import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

interface ProblemJSON {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  timestamp: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  let statusCode = 500;
  let type = 'INTERNAL_ERROR';
  let title = 'Internal Server Error';
  let detail = 'An unexpected error occurred';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    type = err.type;
    detail = err.message;
    
    switch (statusCode) {
      case 400:
        title = 'Bad Request';
        break;
      case 401:
        title = 'Unauthorized';
        break;
      case 404:
        title = 'Not Found';
        break;
      case 409:
        title = 'Conflict';
        break;
      default:
        title = 'Application Error';
    }
  }

  const problemJSON: ProblemJSON = {
    type: `https://radiantgo.com/errors/${type}`,
    title,
    status: statusCode,
    detail,
    instance: req.url,
    timestamp: new Date().toISOString()
  };

  res.status(statusCode).json(problemJSON);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const problemJSON: ProblemJSON = {
    type: 'https://radiantgo.com/errors/NOT_FOUND',
    title: 'Not Found',
    status: 404,
    detail: `Route ${req.method} ${req.url} not found`,
    instance: req.url,
    timestamp: new Date().toISOString()
  };

  res.status(404).json(problemJSON);
};