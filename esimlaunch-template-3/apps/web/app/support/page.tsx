'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <div className="min-h-screen py-10" style={{ background: 'var(--night)' }}>
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <span className="section-label mb-3 inline-block">Support</span>
          <h1 className="mb-2 text-3xl font-bold md:text-4xl" style={{ color: 'var(--text)' }}>
            Help Center
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Find answers, installation guides, and get support
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab bar */}
          <div className="mb-6 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList
              className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-4 lg:grid-cols-7 gap-1 p-1 rounded-xl"
              style={{
                background: 'var(--night-100)',
                border: '1px solid var(--border)',
              }}
            >
              {[
                { value: 'install', icon: FileText, label: 'Install' },
                { value: 'troubleshooting', icon: Wrench, label: 'Help' },
                { value: 'device', icon: Smartphone, label: 'Device' },
                { value: 'refund', icon: DollarSign, label: 'Refund' },
                { value: 'terms', icon: Scale, label: 'Terms' },
                { value: 'affiliate', icon: Users, label: 'Affiliate' },
                { value: 'contact', icon: Mail, label: 'Contact' },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-1.5 text-xs sm:text-sm whitespace-nowrap px-3 sm:px-4 py-2 rounded-lg transition-all"
                  style={{
                    color: activeTab === value ? 'var(--text)' : 'var(--text-muted)',
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="install">
            <InstallGuides />
          </TabsContent>

          <TabsContent value="troubleshooting">
            <Troubleshooting />
          </TabsContent>

          <TabsContent value="device">
            <div
              className="card rounded-xl p-6"
              style={{ background: 'var(--night-50)', border: '1px solid var(--border)' }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(79,126,255,0.12)', color: 'var(--electric)' }}
                >
                  <Smartphone className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Device Compatibility Checker
                </h2>
              </div>
              <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
                Check if your device supports eSIM before purchasing a plan.
              </p>
              <Link href="/support/device-check">
                <button className="btn-primary">Check Device Compatibility</button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="refund">
            <RefundPolicy />
          </TabsContent>

          <TabsContent value="terms">
            <TermsOfService />
          </TabsContent>

          <TabsContent value="affiliate">
            <div
              className="card rounded-xl p-6"
              style={{ background: 'var(--night-50)', border: '1px solid var(--border)' }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(0,229,192,0.1)', color: 'var(--glow)' }}
                >
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Affiliate Terms
                </h2>
              </div>
              <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
                Rules and payout conditions for affiliates.
              </p>
              <Link href="/account/affiliate">
                <button className="btn-primary">View Affiliate Dashboard</button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <div
              className="card rounded-xl p-6"
              style={{ background: 'var(--night-50)', border: '1px solid var(--border)' }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'rgba(79,126,255,0.12)', color: 'var(--electric)' }}
                >
                  <Mail className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Contact Support
                </h2>
              </div>
              <p className="mb-5 text-sm" style={{ color: 'var(--text-muted)' }}>
                Need help? Send us a message and we&apos;ll get back to you as soon as possible.
              </p>
              <Link href="/contact">
                <button className="btn-primary">Open Contact Form</button>
              </Link>
            </div>
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
        <div
          className="flex min-h-[50vh] items-center justify-center"
          style={{ background: 'var(--night)' }}
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2"
            style={{
              borderColor: 'var(--border)',
              borderTopColor: 'var(--electric)',
            }}
          />
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}
