'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

export function InstallGuides() {
  return (
    <div className="space-y-6">
      <p className="text-ink-secondary">
        Follow our step-by-step guides to install your eSIM on your device. Installation usually
        takes less than 5 minutes.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/support/device-check">
          <Button className="btn-primary">
            <Smartphone className="mr-2 h-4 w-4" />
            Check if your device supports eSIM
          </Button>
        </Link>
        <Link href="/esim-setup-guide">
          <Button variant="outline" className="btn-secondary">
            eSIM Setup Guide
          </Button>
        </Link>
        <Link href="/help-center/install">
          <Button variant="outline" className="btn-secondary">
            Installation Help
          </Button>
        </Link>
      </div>
    </div>
  );
}
