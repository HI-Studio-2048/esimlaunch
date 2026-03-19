'use client';

import Link from 'next/link';
import { Scale } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="space-y-6">
      <p style={{ color: 'var(--text-muted)' }}>
        Our Terms of Service govern your use of our eSIM platform and services.
      </p>
      <div
        className="rounded-card"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--night-50)',
        }}
      >
        <div className="p-6 pb-2">
          <h3
            className="flex items-center gap-2 text-base font-semibold"
            style={{ color: 'var(--text)' }}
          >
            <Scale className="h-5 w-5" style={{ color: 'var(--electric)' }} />
            Terms of Service
          </h3>
        </div>
        <div className="p-6 pt-2">
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            By using our website and purchasing eSIM plans, you agree to our terms. Key points
            include service description, account and payments, use of service, and limitations
            of liability.
          </p>
          <Link href="/terms">
            <button className="btn-secondary">
              View Full Terms of Service
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
