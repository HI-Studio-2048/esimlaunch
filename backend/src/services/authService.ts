import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto, { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { ServiceType, MerchantRole } from '@prisma/client';
import { emailService } from './emailService';

// AES-256-GCM encryption for SMTP passwords at rest
const ENCRYPTION_KEY = crypto.createHash('sha256').update(env.jwtSecret).digest(); // 32 bytes for AES-256

export function encryptSmtpPassword(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSmtpPassword(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  serviceType?: ServiceType;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  merchant: {
    id: string;
    email: string;
    name: string | null;
    role: MerchantRole;
    serviceType: ServiceType;
    twoFactorEnabled: boolean;
  };
  token: string;
}

export interface ApiKeyResponse {
  id: string;
  keyPrefix: string;
  name: string | null;
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  // Only include the full key on creation
  key?: string;
}

class AuthService {
  /**
   * Register a new merchant
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if email already exists
    const existingMerchant = await prisma.merchant.findUnique({
      where: { email: data.email },
    });

    if (existingMerchant) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create merchant – auto-assign ADMIN role for the configured admin email
    const role = data.email.toLowerCase() === env.adminEmail.toLowerCase()
      ? MerchantRole.ADMIN
      : MerchantRole.MERCHANT;

    const merchant = await prisma.merchant.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role,
        serviceType: data.serviceType || ServiceType.ADVANCED,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        serviceType: true,
        twoFactorEnabled: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken(merchant.id);

    // Send verification email
    try {
      const { emailService } = await import('./emailService');
      const verificationToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: expiresAt,
        },
      });

      await emailService.sendVerificationEmail({
        email: merchant.email,
        verificationToken,
        name: merchant.name || undefined,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    return {
      merchant,
      token,
    };
  }

  /**
   * Login merchant
   */
  async login(data: LoginData): Promise<AuthResponse> {
    // Find merchant
    const merchant = await prisma.merchant.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        serviceType: true,
        password: true,
        isActive: true,
        twoFactorEnabled: true,
      },
    });

    if (!merchant) {
      throw new Error('Invalid email or password');
    }

    if (!merchant.isActive) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, merchant.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(merchant.id);

    return {
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        role: merchant.role,
        serviceType: merchant.serviceType,
        twoFactorEnabled: merchant.twoFactorEnabled,
      },
      token,
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(merchantId: string): string {
    return jwt.sign(
      { merchantId },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as any }
    );
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<{ merchantId: string }> {
    try {
      const decoded = jwt.verify(token, env.jwtSecret) as { merchantId: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate API key for merchant
   */
  async generateApiKey(
    merchantId: string,
    name?: string,
    rateLimit?: number,
    expiresInDays?: number
  ): Promise<ApiKeyResponse> {
    // Generate a secure API key
    const randomPart = randomBytes(32).toString('hex');
    const apiKey = `sk_live_${randomPart}`;
    const keyPrefix = apiKey.substring(0, 12); // First 12 chars for display

    // Hash the API key before storing
    const hashedKey = await bcrypt.hash(apiKey, 10);

    // Calculate expiration date if provided
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create API key record
    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        keyPrefix,
        merchantId,
        name: name || null,
        rateLimit: rateLimit || 100,
        expiresAt,
      },
    });

    return {
      id: apiKeyRecord.id,
      keyPrefix: apiKeyRecord.keyPrefix,
      name: apiKeyRecord.name,
      rateLimit: apiKeyRecord.rateLimit,
      isActive: apiKeyRecord.isActive,
      lastUsedAt: apiKeyRecord.lastUsedAt,
      createdAt: apiKeyRecord.createdAt,
      expiresAt: apiKeyRecord.expiresAt,
      key: apiKey, // Only return full key on creation
    };
  }

  /**
   * List merchant's API keys
   */
  async listApiKeys(merchantId: string): Promise<ApiKeyResponse[]> {
    const apiKeys = await prisma.apiKey.findMany({
      where: { 
        merchantId,
        isActive: true, // Only return active (non-revoked) keys
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map((key) => ({
      id: key.id,
      keyPrefix: key.keyPrefix,
      name: key.name,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
    }));
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(merchantId: string, apiKeyId: string): Promise<void> {
    // Verify the API key belongs to the merchant
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        merchantId,
      },
    });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Deactivate the API key
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false },
    });
  }

  /**
   * Get merchant by ID
   */
  async getMerchantById(merchantId: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        serviceType: true,
        isActive: true,
        createdAt: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpFromName: true,
        smtpFromEmail: true,
      },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    return merchant;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const merchant = await prisma.merchant.findUnique({
      where: { email },
    });

    if (!merchant) {
      // Don't reveal if email exists for security
      return;
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this merchant
    await prisma.passwordResetToken.deleteMany({
      where: { merchantId: merchant.id },
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        merchantId: merchant.id,
        token,
        expiresAt,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail({
      email: merchant.email,
      resetToken: token,
      name: merchant.name || undefined,
    });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ email: string; name: string | null }> {
    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { merchant: true },
    });

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    if (resetToken.used) {
      throw new Error('Reset token has already been used');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password, mark token as used, and invalidate all sessions
    await prisma.$transaction([
      prisma.merchant.update({
        where: { id: resetToken.merchantId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      prisma.session.deleteMany({
        where: { merchantId: resetToken.merchantId },
      }),
    ]);

    return { email: resetToken.merchant.email, name: resetToken.merchant.name };
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(token: string): Promise<boolean> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return false;
    }

    if (resetToken.used) {
      return false;
    }

    if (resetToken.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Update merchant profile
   */
  async updateProfile(merchantId: string, data: {
    name?: string;
    email?: string;
    serviceType?: ServiceType;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFromName?: string;
    smtpFromEmail?: string;
  }) {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;

    if (data.email !== undefined) {
      const existingMerchant = await prisma.merchant.findUnique({ where: { email: data.email } });
      if (existingMerchant && existingMerchant.id !== merchantId) {
        throw new Error('Email already registered');
      }
      updateData.email = data.email;
    }
    
    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
    if (data.smtpHost !== undefined) updateData.smtpHost = data.smtpHost || null;
    if (data.smtpPort !== undefined) updateData.smtpPort = data.smtpPort || null;
    if (data.smtpUser !== undefined) updateData.smtpUser = data.smtpUser || null;
    if (data.smtpPass !== undefined) updateData.smtpPass = data.smtpPass ? encryptSmtpPassword(data.smtpPass) : null;
    if (data.smtpFromName !== undefined) updateData.smtpFromName = data.smtpFromName || null;
    if (data.smtpFromEmail !== undefined) updateData.smtpFromEmail = data.smtpFromEmail || null;

    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        serviceType: true,
        isActive: true,
        createdAt: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpFromName: true,
        smtpFromEmail: true,
      },
    });

    return merchant;
  }

  /**
   * Change password
   */
  async changePassword(merchantId: string, currentPassword: string, newPassword: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { password: true },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, merchant.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Delete merchant account (soft delete)
   */
  async deleteAccount(merchantId: string) {
    // Soft delete by setting isActive to false
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { isActive: false },
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const merchant = await prisma.merchant.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!merchant) {
      throw new Error('Invalid verification token');
    }

    if (merchant.emailVerificationExpires && merchant.emailVerificationExpires < new Date()) {
      throw new Error('Verification token has expired');
    }

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(merchantId: string): Promise<void> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new Error('Merchant not found');
    }

    if (merchant.emailVerified) {
      throw new Error('Email is already verified');
    }

    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: expiresAt,
      },
    });

    const { emailService } = await import('./emailService');
    await emailService.sendVerificationEmail({
      email: merchant.email,
      verificationToken,
      name: merchant.name || undefined,
    });
  }
}

export const authService = new AuthService();

