import request from 'supertest';
import express from 'express';
import { errorHandler, notFoundHandler } from '../../middlewares/errorHandler';
import { AppError, ValidationError, NotFoundError } from '../../utils/errors';

const app = express();
app.use(express.json());

// Test routes that throw different types of errors
app.get('/test-app-error', (req, res, next) => {
  next(new AppError('Test app error', 400, 'TEST_ERROR'));
});

app.get('/test-validation-error', (req, res, next) => {
  next(new ValidationError('Test validation error'));
});

app.get('/test-not-found-error', (req, res, next) => {
  next(new NotFoundError('TestResource'));
});

app.get('/test-generic-error', (req, res, next) => {
  next(new Error('Generic error'));
});

app.use(notFoundHandler);
app.use(errorHandler);

describe('Error Handler Middleware', () => {
  describe('errorHandler', () => {
    it('should handle AppError correctly', async () => {
      const response = await request(app)
        .get('/test-app-error');

      expect(response.status).toBe(400);
      expect(response.body.type).toBe('https://radiantgo.com/errors/TEST_ERROR');
      expect(response.body.title).toBe('Bad Request');
      expect(response.body.detail).toBe('Test app error');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle ValidationError correctly', async () => {
      const response = await request(app)
        .get('/test-validation-error');

      expect(response.status).toBe(400);
      expect(response.body.type).toBe('https://radiantgo.com/errors/VALIDATION_ERROR');
      expect(response.body.title).toBe('Bad Request');
      expect(response.body.detail).toBe('Test validation error');
    });

    it('should handle NotFoundError correctly', async () => {
      const response = await request(app)
        .get('/test-not-found-error');

      expect(response.status).toBe(404);
      expect(response.body.type).toBe('https://radiantgo.com/errors/NOT_FOUND');
      expect(response.body.title).toBe('Not Found');
      expect(response.body.detail).toBe('TestResource not found');
    });

    it('should handle generic errors as internal server error', async () => {
      const response = await request(app)
        .get('/test-generic-error');

      expect(response.status).toBe(500);
      expect(response.body.type).toBe('https://radiantgo.com/errors/INTERNAL_ERROR');
      expect(response.body.title).toBe('Internal Server Error');
      expect(response.body.detail).toBe('An unexpected error occurred');
    });
  });

  describe('notFoundHandler', () => {
    it('should handle 404 routes correctly', async () => {
      const response = await request(app)
        .get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body.type).toBe('https://radiantgo.com/errors/NOT_FOUND');
      expect(response.body.title).toBe('Not Found');
      expect(response.body.detail).toContain('Route GET /non-existent-route not found');
    });
  });
});