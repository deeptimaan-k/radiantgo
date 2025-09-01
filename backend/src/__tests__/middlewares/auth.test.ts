import request from 'supertest';
import express from 'express';
import { authenticate } from '../../middlewares/auth';
import { User } from '../../models/User';
import { generateToken } from '../../utils/jwt';

const app = express();
app.use(express.json());
app.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

describe('Auth Middleware', () => {
  let testUser: any;
  let validToken: string;

  beforeEach(async () => {
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
    
    validToken = generateToken(testUser);
  });

  it('should allow access with valid token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe(testUser.email);
  });

  it('should reject request without token', async () => {
    const response = await request(app)
      .get('/protected');

    expect(response.status).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  it('should reject request with malformed authorization header', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Authorization', 'InvalidFormat token');

    expect(response.status).toBe(401);
  });
});