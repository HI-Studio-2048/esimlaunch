'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Smartphone } from 'lucide-react';

export function InstallGuides() {
  return (
    <div className="space-y-6">
      <p className="text-slate-600">
        Follow our step-by-step guides to install your eSIM on your device. Installation usually
        takes less than 5 minutes.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link href="/support/device-check">
          <Button className="bg-violet-600 text-white hover:bg-violet-700">
            <Smartphone className="mr-2 h-4 w-4" />
            Check if your device supports eSIM
          </Button>
        </Link>
        <Link href="/esim-setup-guide">
          <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
            eSIM Setup Guide
          </Button>
        </Link>
        <Link href="/help-center/install">
          <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
            Installation Help
          </Button>
        </Link>
      </div>
    </div>
  );
}
