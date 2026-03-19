'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';

export function TermsOfService() {
  return (
    <div className="space-y-6">
      <p className="text-ink-secondary">
        Our Terms of Service govern your use of our eSIM platform and services.
      </p>
      <Card className="border-surface-border bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-ink">
            <Scale className="h-5 w-5" />
            Terms of Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-ink-secondary">
            By using our website and purchasing eSIM plans, you agree to our terms. Key points
            include service description, account and payments, use of service, and limitations
            of liability.
          </p>
          <Link href="/terms">
            <Button variant="outline" className="border-surface-border text-ink-secondary hover:bg-surface-soft">
              View Full Terms of Service
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
