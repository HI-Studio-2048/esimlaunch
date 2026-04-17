import { clerkClient } from '@clerk/clerk-sdk-node';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { authService } from './authService';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MERCHANT_SYNC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  serviceType: true,
  isActive: true,
  createdAt: true,
} as const;

function normalizeMerchantEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Match legacy rows whose email differs only by case from Clerk’s value. */
async function findMerchantByEmailFlexible(normalizedEmail: string) {
  const exact = await prisma.merchant.findUnique({
    where: { email: normalizedEmail },
  });
  if (exact) return exact;
  return prisma.merchant.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: 'insensitive' },
    },
  });
}

class ClerkService {
  /**
   * Apply a referral code to the given merchant if and only if they don't
   * already have a referrer. Returns a status describing what happened so
   * callers can surface feedback to the UI.
   *
   * This runs on every sync (create OR find) to survive the race where the
   * Clerk `user.created` webhook creates the merchant before `/clerk-sync`
   * arrives with the referral code. As long as `referredBy` is still null,
   * whichever request carries the referralCode will win.
   */
  private async applyReferralIfEligible(
    merchantId: string,
    referralCode: string
  ): Promise<'tracked' | 'invalid' | 'self' | null> {
    try {
      const affiliate = await prisma.merchant.findUnique({
        where: { referralCode },
        select: { id: true },
      });
      if (!affiliate) {
        console.warn(`Clerk sync: invalid referral code "${referralCode}" — ignored`);
        return 'invalid';
      }
      if (affiliate.id === merchantId) {
        console.warn(`Clerk sync: self-referral attempt by merchant ${merchantId} — ignored`);
        return 'self';
      }

      // Atomic compare-and-set: only update if referredBy is still null.
      // Eliminates the SELECT→UPDATE race where two concurrent syncs both see
      // referredBy=null and the second overwrites the first.
      const rowsAffected = await prisma.$executeRaw`
        UPDATE "Merchant"
        SET "referredBy" = ${affiliate.id}
        WHERE "id" = ${merchantId} AND "referredBy" IS NULL
      `;
      if (rowsAffected === 0) {
        // Already attributed by a concurrent request (or merchant not found).
        return null;
      }
      return 'tracked';
    } catch (err) {
      console.warn('Clerk sync: referral tracking failed:', err);
      return 'invalid';
    }
  }

  /**
   * Sync Clerk user to merchant account.
   * `referralCode` attaches only if the merchant has no referrer yet — this
   * makes application idempotent and safe against the webhook/clerk-sync race.
   */
  async syncClerkUser(clerkUserId: string, email: string, name?: string, referralCode?: string) {
    const normalizedEmail = normalizeMerchantEmail(email);
    if (!normalizedEmail) {
      throw new Error('Clerk user has no valid email');
    }

    // Check if merchant already exists with this Clerk ID
    let merchant = await prisma.merchant.findUnique({
      where: { clerkUserId },
    });

    if (merchant) {
      // Update email/name if changed
      const updated = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          email: normalizedEmail,
          name: name || merchant.name,
        },
        select: MERCHANT_SYNC_SELECT,
      });
      const referralStatus = referralCode
        ? await this.applyReferralIfEligible(updated.id, referralCode)
        : null;
      return Object.assign(updated, { referralStatus });
    }

    // Check if merchant exists with this email (exact + case-insensitive)
    merchant = await findMerchantByEmailFlexible(normalizedEmail);

    if (merchant) {
      if (merchant.clerkUserId && merchant.clerkUserId !== clerkUserId) {
        throw new Error(
          'This email is already registered to another account. Sign in with your existing method or use a different email.'
        );
      }
      // Link Clerk ID to existing merchant (or refresh same user)
      const linked = await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          clerkUserId,
          email: normalizedEmail,
          name: name || merchant.name,
        },
        select: MERCHANT_SYNC_SELECT,
      });
      const referralStatus = referralCode
        ? await this.applyReferralIfEligible(linked.id, referralCode)
        : null;
      return Object.assign(linked, { referralStatus });
    }

    // Create new merchant account
    // Generate a random password since Clerk handles auth
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    let created;
    try {
      created = await prisma.merchant.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name,
          clerkUserId,
          serviceType: 'ADVANCED',
        },
        select: MERCHANT_SYNC_SELECT,
      });
    } catch (err) {
      // Webhook + /clerk-sync (or double client calls) can race; Prisma then hits @unique(email).
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existing =
          (await prisma.merchant.findUnique({ where: { clerkUserId } })) ??
          (await findMerchantByEmailFlexible(normalizedEmail));
        if (existing) {
          if (existing.clerkUserId && existing.clerkUserId !== clerkUserId) {
            throw new Error(
              'This email is already registered to another account. Sign in with your existing method or use a different email.'
            );
          }
          const relinked = await prisma.merchant.update({
            where: { id: existing.id },
            data: {
              clerkUserId,
              email: normalizedEmail,
              name: name || existing.name,
            },
            select: MERCHANT_SYNC_SELECT,
          });
          const referralStatus = referralCode
            ? await this.applyReferralIfEligible(relinked.id, referralCode)
            : null;
          return Object.assign(relinked, { referralStatus });
        }
      }
      throw err;
    }

    const referralStatus = referralCode
      ? await this.applyReferralIfEligible(created.id, referralCode)
      : null;
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

