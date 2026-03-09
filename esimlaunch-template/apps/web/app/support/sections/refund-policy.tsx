'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

export function RefundPolicy() {
  return (
    <div className="space-y-6">
      <p className="text-slate-600">
        Our refund policy covers pre-activation refunds, technical issues, and device
        incompatibility. Full details are available on our refund policy page.
      </p>
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <DollarSign className="h-5 w-5" />
            Refund Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-slate-600">
            Before activation: full refund within 14 days. After activation: generally no refunds.
            Technical issues and device incompatibility may be considered on a case-by-case basis.
          </p>
          <Link href="/refund">
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
              View Full Refund Policy
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
