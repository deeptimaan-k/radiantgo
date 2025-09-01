import { generateToken, verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import { User } from '../../models/User';

describe('JWT Utils', () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken(testUser);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(testUser);
      const payload = verifyToken(token);
      
      expect(payload.userId).toBe(testUser._id.toString());
      expect(payload.email).toBe(testUser.email);
      expect(payload.role).toBe(testUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid.token.here'))
        .toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('not-a-jwt-token'))
        .toThrow('Invalid or expired token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'valid.jwt.token';
      const header = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      expect(extractTokenFromHeader('InvalidFormat token')).toBeNull();
      expect(extractTokenFromHeader('token')).toBeNull();
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });

    it('should return null for empty header', () => {
      expect(extractTokenFromHeader('')).toBeNull();
    });
  });
});