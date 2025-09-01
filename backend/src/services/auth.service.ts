import { User, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import logger from '../utils/logger';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  token: string;
}

export class AuthService {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const { email, password, name } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name: name.trim()
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    logger.info(`User registered: ${user.email}`);

    return {
      user,
      token
    };
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user);

    logger.info(`User logged in: ${user.email}`);

    // Remove password from response
    user.password = undefined as any;

    return {
      user,
      token
    };
  }

  async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return user;
  }
}

export const authService = new AuthService();