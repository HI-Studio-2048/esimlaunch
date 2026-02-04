import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { prisma } from '../lib/prisma';

class TwoFactorService {
  /**
   * Generate 2FA secret and QR code
   */
  async generateSecret(merchantId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `eSIM Launch (${email})`,
      issuer: 'eSIM Launch',
      length: 32,
    });

    // Store secret temporarily (not enabled yet)
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32,
    };
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(merchantId: string, token: string): Promise<boolean> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!merchant || !merchant.twoFactorSecret || !merchant.twoFactorEnabled) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: merchant.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) before/after
    });

    return verified;
  }

  /**
   * Verify token during setup (before enabling)
   */
  async verifySetupToken(merchantId: string, token: string): Promise<boolean> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { twoFactorSecret: true },
    });

    if (!merchant || !merchant.twoFactorSecret) {
      return false;
    }

    const verified = speakeasy.totp.verify({
      secret: merchant.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    return verified;
  }

  /**
   * Enable 2FA for merchant
   */
  async enable(merchantId: string) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { twoFactorSecret: true },
    });

    if (!merchant || !merchant.twoFactorSecret) {
      throw new Error('2FA secret not found. Please generate a new secret first.');
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: { twoFactorEnabled: true },
    });
  }

  /**
   * Disable 2FA for merchant
   */
  async disable(merchantId: string) {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  /**
   * Check if 2FA is enabled for merchant
   */
  async isEnabled(merchantId: string): Promise<boolean> {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { twoFactorEnabled: true },
    });

    return merchant?.twoFactorEnabled || false;
  }
}

export const twoFactorService = new TwoFactorService();

