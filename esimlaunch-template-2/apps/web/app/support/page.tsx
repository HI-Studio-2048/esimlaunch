'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Wrench,
  Smartphone,
  DollarSign,
  Scale,
  Mail,
  Users,
} from 'lucide-react';
import { InstallGuides } from './sections/install-guides';
import { Troubleshooting } from './sections/troubleshooting';
import { RefundPolicy } from './sections/refund-policy';
import { TermsOfService } from './sections/terms';

function SupportContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'install');

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="mb-2 text-3xl font-bold text-ink md:text-4xl">
            Help Center
          </h1>
          <p className="text-ink-muted">
            Find answers, installation guides, and get support
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-4 lg:grid-cols-7 gap-1 md:gap-2 bg-surface-muted p-1 rounded-lg">
              <TabsTrigger
                value="install"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Install</span>
              </TabsTrigger>
              <TabsTrigger
                value="troubleshooting"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <Wrench className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Help</span>
              </TabsTrigger>
              <TabsTrigger
                value="device"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Device</span>
              </TabsTrigger>
              <TabsTrigger
                value="refund"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <DollarSign className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Refund</span>
              </TabsTrigger>
              <TabsTrigger
                value="terms"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <Scale className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Terms</span>
              </TabsTrigger>
              <TabsTrigger
                value="affiliate"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">Affiliate</span>
              </TabsTrigger>
              <TabsTrigger
                value="contact"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Contact</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="install">
            <InstallGuides />
          </TabsContent>

          <TabsContent value="troubleshooting">
            <Troubleshooting />
          </TabsContent>

          <TabsContent value="device">
            <Card className="border-surface-border bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink">
                  <Smartphone className="h-5 w-5" />
                  Device Compatibility Checker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-ink-muted">
                  Check if your device supports eSIM before purchasing a plan.
                </p>
                <Link href="/support/device-check">
                  <button className="btn-primary">
                    Check Device Compatibility
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refund">
            <RefundPolicy />
          </TabsContent>

          <TabsContent value="terms">
            <TermsOfService />
          </TabsContent>

          <TabsContent value="affiliate">
            <Card className="border-surface-border bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink">
                  <Users className="h-5 w-5" />
                  Affiliate Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-ink-muted">
                  Rules and payout conditions for affiliates.
                </p>
                <Link href="/account/affiliate">
                  <button className="btn-primary">
                    View Affiliate Dashboard
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="border-surface-border bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-ink">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-ink-muted">
                  Need help? Send us a message and we&apos;ll get back to you as soon as possible.
                </p>
                <Link href="/contact">
                  <button className="btn-primary">
                    Open Contact Form
                  </button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}
