import { db } from '../database/connection.js';
import { User as UserModel } from '../database/schemas.js';

export class User {
  static async findAll() {
    return await db.find('users');
  }

  static async findById(id) {
    return await db.findOne('users', { _id: id });
  }

  static async findByEmail(email) {
    return await db.findOne('users', { email });
  }

  static async create(userData) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const user = {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      role: userData.role || 'user'
    };
    
    return await db.insert('users', user);
  }

  static async updateById(id, updateData) {
    return await db.update('users', { _id: id }, updateData);
  }

  static async deleteById(id) {
    return await db.delete('users', { _id: id });
  }

  static async findByRole(role) {
    return await db.find('users', { role });
  }
}