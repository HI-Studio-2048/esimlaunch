'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function SupportTicketsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch } = useAuthFetch();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return;
    authFetch<Ticket[]>('/support/tickets')
      .then(setTickets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, user, authFetch]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d2d2d7] border-t-[#1d1d1f]" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-[#6e6e73]">Please sign in to view your support tickets.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-[#0066cc] hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Breadcrumbs items={[{ label: 'Support', href: '/support' }, { label: 'My Tickets' }]} />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#1d1d1f]">My Tickets</h1>
        <Link
          href="/support/tickets/new"
          className="btn-primary rounded-full px-4 py-2 text-sm font-medium"
        >
          New Ticket
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d2d2d7] border-t-[#1d1d1f]" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[#d2d2d7] bg-[#f5f5f7] py-12 text-center">
          <p className="text-[#6e6e73]">No support tickets yet.</p>
          <Link
            href="/support/tickets/new"
            className="mt-4 inline-block font-medium text-[#0066cc] hover:underline"
          >
            Create a ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/support/tickets/${t.id}`}
              className="card block p-4 transition hover:shadow-card-hover"
            >
              <p className="font-medium text-[#1d1d1f]">{t.subject}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-[#6e6e73]">
                <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[#6e6e73]">{t.status}</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/support" className="text-sm font-medium text-[#0066cc] hover:underline">
          ← Back to Support
        </Link>
      </div>
    </div>
  );
}
