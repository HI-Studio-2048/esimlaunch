import { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma';

class SessionService {
  /**
   * Create a new session
   */
  async createSession(merchantId: string, ipAddress?: string, userAgent?: string, expiresInDays: number = 7) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        merchantId,
        token,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return session;
  }

  /**
   * Get session by token
   */
  async getSession(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { merchant: true },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      await this.deleteSession(token);
      return null;
    }

    // Update last used timestamp
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });

    return session;
  }

  /**
   * Get all active sessions for a merchant
   */
  async getMerchantSessions(merchantId: string) {
    const now = new Date();
    
    // Delete expired sessions
    await prisma.session.deleteMany({
      where: {
        merchantId,
        expiresAt: { lt: now },
      },
    });

    return prisma.session.findMany({
      where: {
        merchantId,
        expiresAt: { gte: now },
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(token: string) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  /**
   * Delete all sessions for a merchant
   */
  async deleteAllMerchantSessions(merchantId: string) {
    await prisma.session.deleteMany({
      where: { merchantId },
    });
  }

  /**
   * Delete a specific session by ID (for a merchant)
   */
  async deleteSessionById(merchantId: string, sessionId: string) {
    await prisma.session.deleteMany({
      where: {
        id: sessionId,
        merchantId,
      },
    });
  }

  /**
   * Extend session expiration
   */
  async extendSession(token: string, additionalDays: number = 7) {
    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const newExpiresAt = new Date(Date.now() + additionalDays * 24 * 60 * 60 * 1000);

    return prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: newExpiresAt },
    });
  }
}

export const sessionService = new SessionService();







