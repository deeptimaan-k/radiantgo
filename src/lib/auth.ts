import axios from 'axios';
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const TOKEN_KEY = 'radiantgo_token';
const USER_KEY = 'radiantgo_user';

export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  
  getUser: (): User | null => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  setUser: (user: User): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

// Add token to requests
authApi.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenManager.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await authApi.post('/auth/register', userData);
    const authData = response.data.data;
    
    tokenManager.setToken(authData.token);
    tokenManager.setUser(authData.user);
    
    return authData;
  },

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await authApi.post('/auth/login', credentials);
    const authData = response.data.data;
    
    tokenManager.setToken(authData.token);
    tokenManager.setUser(authData.user);
    
    return authData;
  },

  async logout(): Promise<void> {
    try {
      await authApi.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      tokenManager.removeToken();
    }
  },

  async getProfile(): Promise<User> {
    const response = await authApi.get('/auth/profile');
    return response.data.data;
  },

  isAuthenticated(): boolean {
    return !!tokenManager.getToken();
  },

  getCurrentUser(): User | null {
    return tokenManager.getUser();
  }
};