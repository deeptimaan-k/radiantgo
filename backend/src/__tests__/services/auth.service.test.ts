import { AuthService } from '../../services/auth.service';
import { User } from '../../models/User';
import { ValidationError, UnauthorizedError } from '../../utils/errors';

const authService = new AuthService();

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const result = await authService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Create first user
      await authService.register(userData);

      // Try to create duplicate
      await expect(authService.register(userData))
        .rejects
        .toThrow(ValidationError);
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123'
      };

      await authService.register(userData);
      
      const user = await User.findOne({ email: userData.email }).select('+password');
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create test user
      await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = await authService.login(credentials);

      expect(result.user.email).toBe(credentials.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      await expect(authService.login(credentials))
        .rejects
        .toThrow(UnauthorizedError);
    });

    it('should throw error for invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      await expect(authService.login(credentials))
        .rejects
        .toThrow(UnauthorizedError);
    });
  });
});