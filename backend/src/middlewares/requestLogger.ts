import morgan from 'morgan';
import logger from '../utils/logger';

// Create a custom stream that writes to our logger
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

// Use a more detailed format for development
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' 
    ? 'combined'
    : ':method :url :status :response-time ms - :res[content-length]',
  { stream }
);