import { clerkClient } from '@clerk/clerk-sdk-node';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { authService } from './authService';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class ClerkService {
  /**
   * Sync Clerk user to merchant account
   */
  async syncClerkUser(clerkUserId: string, email: string, name?: string) {
    // Check if merchant already exists with this Clerk ID
    let merchant = await prisma.merchant.findUnique({
      where: { clerkUserId },
    });

    if (merchant) {
      // Update email/name if changed
      return prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          email,
          name: name || merchant.name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          serviceType: true,
          isActive: true,
          createdAt: true,
        },
      });
    }

    // Check if merchant exists with this email
    merchant = await prisma.merchant.findUnique({
      where: { email },
    });

    if (merchant) {
      // Link Clerk ID to existing merchant
      return prisma.merchant.update({
        where: { id: merchant.id },
        data: { clerkUserId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          serviceType: true,
          isActive: true,
          createdAt: true,
        },
      });
    }

    // Create new merchant account
    // Generate a random password since Clerk handles auth
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    return prisma.merchant.create({
      data: {
        email,
        password: hashedPassword,
        name,
        clerkUserId,
        serviceType: 'ADVANCED',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        serviceType: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  /**
   * Get or create merchant from Clerk user
   */
  async getOrCreateMerchantFromClerk(clerkUserId: string) {
    try {
      // Get user from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) {
        throw new Error('Clerk user has no email');
      }

      const name = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.lastName || undefined;

      return this.syncClerkUser(clerkUserId, email, name);
    } catch (error) {
      console.error('Error syncing Clerk user:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token for Clerk-authenticated user
   */
  async generateTokenForClerkUser(clerkUserId: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { clerkUserId },
    });

    if (!merchant) {
      throw new Error('Merchant not found for Clerk user');
    }

    return authService.generateToken(merchant.id);
  }
}

export const clerkService = new ClerkService();

