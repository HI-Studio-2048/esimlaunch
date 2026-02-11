import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import crypto from 'crypto';

export interface CustomerRegisterParams {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface CustomerLoginParams {
  email: string;
  password: string;
}

export const customerAuthService = {
  /**
   * Register a new customer
   */
  async register(params: CustomerRegisterParams) {
    const { email, password, name, phone } = params;

    // Check if customer already exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('Customer with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phone: phone || null,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { customerId: customer.id, email: customer.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      customer,
      token,
    };
  },

  /**
   * Login customer
   */
  async login(params: CustomerLoginParams) {
    const { email, password } = params;

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer || !customer.password) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { customerId: customer.id, email: customer.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        emailVerified: customer.emailVerified,
        createdAt: customer.createdAt,
      },
      token,
    };
  },

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: string) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string) {
    return prisma.customer.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Update customer profile
   */
  async updateProfile(customerId: string, data: {
    name?: string;
    phone?: string;
  }) {
    return prisma.customer.update({
      where: { id: customerId },
      data: {
        name: data.name,
        phone: data.phone,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Change customer password
   */
  async changePassword(customerId: string, oldPassword: string, newPassword: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { password: true },
    });

    if (!customer || !customer.password) {
      throw new Error('Customer not found or password not set');
    }

    // Verify old password
    const isValid = await bcrypt.compare(oldPassword, customer.password);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.customer.update({
      where: { id: customerId },
      data: { password: hashedPassword },
    });

    return { success: true };
  },

  /**
   * Verify customer email
   */
  async verifyEmail(customerId: string) {
    return prisma.customer.update({
      where: { id: customerId },
      data: { emailVerified: true },
    });
  },
};


