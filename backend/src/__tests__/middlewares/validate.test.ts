import request from 'supertest';
import express from 'express';
import Joi from 'joi';
import { validate, validateParams, validateQuery } from '../../middlewares/validate';

const app = express();
app.use(express.json());

// Test routes
const testSchema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().min(0).required()
});

const paramsSchema = Joi.object({
  id: Joi.string().required()
});

const querySchema = Joi.object({
  search: Joi.string().required()
});

app.post('/test-body', validate(testSchema), (req, res) => {
  res.json({ success: true });
});

app.get('/test-params/:id', validateParams(paramsSchema), (req, res) => {
  res.json({ success: true });
});

app.get('/test-query', validateQuery(querySchema), (req, res) => {
  res.json({ success: true });
});

describe('Validation Middleware', () => {
  describe('validate (body)', () => {
    it('should pass validation with valid data', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({ name: 'John', age: 25 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail validation with invalid data', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({ name: 'John' }); // Missing age

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });

    it('should fail validation with wrong data types', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({ name: 'John', age: 'not-a-number' });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });
  });

  describe('validateParams', () => {
    it('should pass validation with valid params', async () => {
      const response = await request(app)
        .get('/test-params/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('validateQuery', () => {
    it('should pass validation with valid query', async () => {
      const response = await request(app)
        .get('/test-query')
        .query({ search: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should fail validation with missing query params', async () => {
      const response = await request(app)
        .get('/test-query');

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('VALIDATION_ERROR');
    });
  });
});