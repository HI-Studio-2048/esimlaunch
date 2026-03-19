'use client';

import Link from 'next/link';
import { DollarSign } from 'lucide-react';

export function RefundPolicy() {
  return (
    <div className="space-y-6">
      <p style={{ color: 'var(--text-muted)' }}>
        Our refund policy covers pre-activation refunds, technical issues, and device
        incompatibility. Full details are available on our refund policy page.
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
            <DollarSign className="h-5 w-5" style={{ color: 'var(--electric)' }} />
            Refund Policy
          </h3>
        </div>
        <div className="p-6 pt-2">
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Before activation: full refund within 14 days. After activation: generally no refunds.
            Technical issues and device incompatibility may be considered on a case-by-case basis.
          </p>
          <Link href="/refund">
            <button className="btn-secondary">
              View Full Refund Policy
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
