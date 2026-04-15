import { clerkClient } from '@clerk/clerk-sdk-node';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { authService } from './authService';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class ClerkService {
  /**
   * Sync Clerk user to merchant account.
   * `referralCode` is only applied when a brand-new merchant is created —
   * it's ignored for existing merchants (login, re-sync, email relinking).
   */
  async syncClerkUser(clerkUserId: string, email: string, name?: string, referralCode?: string) {
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

    const created = await prisma.merchant.create({
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

    // Apply referral tracking for new merchants only. Failure here must not
    // break signup — just log and surface the reason via referralStatus.
    let referralStatus: 'tracked' | 'invalid' | 'self' | null = null;
    if (referralCode) {
      try {
        const affiliate = await prisma.merchant.findUnique({
          where: { referralCode },
          select: { id: true },
        });
        if (!affiliate) {
          referralStatus = 'invalid';
          console.warn(`Clerk signup: invalid referral code "${referralCode}" — ignored`);
        } else if (affiliate.id === created.id) {
          referralStatus = 'self';
          console.warn(`Clerk signup: self-referral attempt by merchant ${created.id} — ignored`);
        } else {
          await prisma.merchant.update({
            where: { id: created.id },
            data: { referredBy: affiliate.id },
          });
          referralStatus = 'tracked';
        }
      } catch (refErr) {
        referralStatus = 'invalid';
        console.warn('Clerk signup: referral tracking failed:', refErr);
      }
    }

    return Object.assign(created, { referralStatus });
  }

  /**
   * Get or create merchant from Clerk user.
   * `referralCode` forwards to syncClerkUser — only applied if a new merchant
   * is created. Ignored on login or existing-account relink.
   */
  async getOrCreateMerchantFromClerk(clerkUserId: string, referralCode?: string) {
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

      return this.syncClerkUser(clerkUserId, email, name, referralCode);
    } catch (error) {
      console.error('Error syncing Clerk user:', error);
      throw error;
    }
  }

  /**
   * Generate JWT token for Clerk-authenticated user
   */
  /**
   * Verify a Clerk session token and return the user ID.
   * This proves the caller actually owns the Clerk session.
   */
  async verifySessionToken(sessionToken: string): Promise<string> {
    try {
      const session = await clerkClient.verifyToken(sessionToken);
      if (!session?.sub) {
        throw new Error('Invalid session token');
      }
      return session.sub; // This is the Clerk user ID
    } catch (error) {
      throw new Error('Invalid or expired Clerk session token');
    }
  }

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

