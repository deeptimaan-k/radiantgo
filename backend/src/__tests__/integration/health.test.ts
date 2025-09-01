import request from 'supertest';
import App from '../../app';

const app = new App().app;

describe('Health Check Integration', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBeOneOf([200, 503]);
      expect(response.body.status).toBeOneOf(['healthy', 'degraded', 'unhealthy']);
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.services).toBeDefined();
      expect(response.body.services.mongodb).toBeDefined();
      expect(response.body.services.redis).toBeDefined();
    });

    it('should include system metrics', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.body.system).toBeDefined();
      expect(response.body.system.memory).toBeDefined();
      expect(response.body.system.memory.used).toBeGreaterThan(0);
      expect(response.body.system.memory.total).toBeGreaterThan(0);
      expect(response.body.system.memory.percentage).toBeGreaterThanOrEqual(0);
    });

    it('should include service response times when healthy', async () => {
      const response = await request(app)
        .get('/health');

      if (response.body.services.mongodb.status === 'connected') {
        expect(response.body.services.mongodb.responseTime).toBeDefined();
        expect(response.body.services.mongodb.responseTime).toBeGreaterThan(0);
      }

      if (response.body.services.redis.status === 'connected') {
        expect(response.body.services.redis.responseTime).toBeDefined();
        expect(response.body.services.redis.responseTime).toBeGreaterThan(0);
      }
    });
  });
});