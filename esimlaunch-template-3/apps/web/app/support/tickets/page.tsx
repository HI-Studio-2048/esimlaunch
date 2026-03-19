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

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'open') return 'badge-glow';
  if (s === 'resolved' || s === 'closed') return 'badge-ghost';
  if (s === 'pending') return 'badge-amber';
  return 'badge-ghost';
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
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p style={{ color: 'var(--text-muted)' }}>Please sign in to view your support tickets.</p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block font-medium hover:underline"
          style={{ color: 'var(--electric)' }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Breadcrumbs items={[{ label: 'Support', href: '/support' }, { label: 'My Tickets' }]} />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>My Tickets</h1>
        <Link href="/support/tickets/new" className="btn-primary">
          New Ticket
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
          />
        </div>
      ) : tickets.length === 0 ? (
        <div
          className="rounded-card border py-12 text-center"
          style={{
            borderColor: 'var(--border)',
            borderStyle: 'dashed',
            background: 'var(--night-50)',
          }}
        >
          <p style={{ color: 'var(--text-muted)' }}>No support tickets yet.</p>
          <Link
            href="/support/tickets/new"
            className="mt-4 inline-block font-medium hover:underline"
            style={{ color: 'var(--electric)' }}
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
              className="card card-hover block p-4 transition"
            >
              <p className="font-medium" style={{ color: 'var(--text)' }}>{t.subject}</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className={statusBadgeClass(t.status)}>{t.status}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/support"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--electric)' }}
        >
          ← Back to Support
        </Link>
      </div>
    </div>
  );
}
