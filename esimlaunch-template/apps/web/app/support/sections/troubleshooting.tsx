'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Troubleshooting() {
  return (
    <div className="space-y-6">
      <p className="text-slate-600">
        Common issues and how to resolve them.
      </p>
      <div className="space-y-4">
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">QR code won&apos;t scan</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">
            <p>
              Ensure your screen brightness is high and the QR code is clearly visible. You can
              also use the activation code (LPA format) to add the eSIM manually in your device
              settings.
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">No network after activation</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">
            <p>
              Make sure you&apos;ve arrived at your destination and have enabled the eSIM in
              Cellular/Mobile Data settings. Try toggling airplane mode or restarting your
              device. Check that data roaming is enabled for the eSIM line.
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">Need more help?</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-600">
            <p>
              <Link href="/support/tickets/new" className="font-medium text-violet-600 hover:underline">
                Create a support ticket
              </Link>{' '}
              or{' '}
              <Link href="/contact" className="font-medium text-violet-600 hover:underline">
                contact us
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
