'use client';

import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export function InstallGuides() {
  return (
    <div className="space-y-6">
      <p style={{ color: 'var(--text-muted)' }}>
        Follow our step-by-step guides to install your eSIM on your device. Installation usually
        takes less than 5 minutes.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/support/device-check">
          <button className="btn-primary inline-flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Check if your device supports eSIM
          </button>
        </Link>
        <Link href="/esim-setup-guide">
          <button className="btn-secondary">
            eSIM Setup Guide
          </button>
        </Link>
        <Link href="/help-center/install">
          <button className="btn-secondary">
            Installation Help
          </button>
        </Link>
      </div>
    </div>
  );
}
