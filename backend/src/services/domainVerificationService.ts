import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import dns from 'dns/promises';

export interface DomainVerificationResult {
  verified: boolean;
  method: 'dns' | 'file' | null;
  error?: string;
}

export interface DNSRecord {
  type: 'TXT' | 'CNAME';
  name: string;
  value: string;
}

export const domainVerificationService = {
  /**
   * Generate a verification token for a store
   */
  async generateVerificationToken(storeId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    
    // Store token in database
    await prisma.store.update({
      where: { id: storeId },
      data: {
        domainVerificationToken: token,
        domainVerified: false,
      },
    });

    return token;
  },

  /**
   * Verify domain ownership via DNS TXT record
   */
  async verifyDomainViaDNS(domain: string, verificationToken: string): Promise<DomainVerificationResult> {
    try {
      const txtRecordName = `_esimlaunch-verification.${domain}`;
      const expectedValue = `esimlaunch-verification=${verificationToken}`;

      // Resolve TXT records
      const records = await dns.resolveTxt(txtRecordName);

      // Check if verification record exists
      const found = records.some(record => 
        Array.isArray(record) 
          ? record.some(r => r === expectedValue)
          : record === expectedValue
      );

      if (found) {
        return {
          verified: true,
          method: 'dns',
        };
      }

      return {
        verified: false,
        method: 'dns',
        error: 'Verification TXT record not found',
      };
    } catch (error: any) {
      return {
        verified: false,
        method: 'dns',
        error: error.message || 'DNS lookup failed',
      };
    }
  },

  /**
   * Verify domain ownership via CNAME record
   */
  async verifyDomainViaCNAME(domain: string, storeId: string): Promise<DomainVerificationResult> {
    try {
      const cnameValue = `${storeId}.esimlaunch.com`;
      const cnameRecord = await dns.resolveCname(domain);

      if (cnameRecord.includes(cnameValue)) {
        return {
          verified: true,
          method: 'dns',
        };
      }

      return {
        verified: false,
        method: 'dns',
        error: 'CNAME record not found or incorrect',
      };
    } catch (error: any) {
      return {
        verified: false,
        method: 'dns',
        error: error.message || 'CNAME lookup failed',
      };
    }
  },

  /**
   * Get DNS verification instructions
   */
  getDNSInstructions(domain: string, verificationToken: string, storeId: string): {
    txtRecord: DNSRecord;
    cnameRecord: DNSRecord;
  } {
    return {
      txtRecord: {
        type: 'TXT',
        name: `_esimlaunch-verification.${domain}`,
        value: `esimlaunch-verification=${verificationToken}`,
      },
      cnameRecord: {
        type: 'CNAME',
        name: domain,
        value: `${storeId}.esimlaunch.com`,
      },
    };
  },

  /**
   * Check if domain is verified
   */
  async checkVerification(storeId: string, domain: string): Promise<DomainVerificationResult> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        domain: true,
        domainVerificationToken: true,
        domainVerified: true,
        domainVerificationMethod: true,
      },
    });

    if (!store || store.domain !== domain) {
      return {
        verified: false,
        method: null,
        error: 'Domain not configured for this store',
      };
    }

    if (store.domainVerified) {
      return {
        verified: true,
        method: (store.domainVerificationMethod as any) || 'dns',
      };
    }

    // If not verified, try to verify now
    if (store.domainVerificationToken) {
      const result = await this.verifyDomainViaDNS(domain, store.domainVerificationToken);
      
      // Update verification status if successful
      if (result.verified) {
        await prisma.store.update({
          where: { id: storeId },
          data: {
            domainVerified: true,
            domainVerificationMethod: 'dns',
          },
        });
      }
      
      return result;
    }

    return {
      verified: false,
      method: 'dns',
      error: 'No verification token found. Please start verification first.',
    };
  },

  /**
   * Verify domain ownership (main method)
   */
  async verifyDomain(storeId: string, domain: string, method: 'dns' | 'cname' = 'dns'): Promise<DomainVerificationResult> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return {
        verified: false,
        method: null,
        error: 'Store not found',
      };
    }

    // Generate or retrieve verification token
    let verificationToken = store.domainVerificationToken;
    if (!verificationToken) {
      verificationToken = await this.generateVerificationToken(storeId);
    }

    let result: DomainVerificationResult;
    if (method === 'dns') {
      result = await this.verifyDomainViaDNS(domain, verificationToken);
    } else {
      result = await this.verifyDomainViaCNAME(domain, storeId);
    }

    // Update verification status if successful
    if (result.verified) {
      await prisma.store.update({
        where: { id: storeId },
        data: {
          domainVerified: true,
          domainVerificationMethod: method,
        },
      });
    }

    return result;
  },
};

