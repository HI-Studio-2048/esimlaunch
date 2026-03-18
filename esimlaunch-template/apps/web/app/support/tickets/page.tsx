'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';

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
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-slate-600">Please sign in to view your support tickets.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-violet-600 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My Tickets</h1>
        <Link
          href="/support/tickets/new"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          New Ticket
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
          <p className="text-slate-600">No support tickets yet.</p>
          <Link
            href="/support/tickets/new"
            className="mt-4 inline-block font-medium text-violet-600 hover:text-violet-700"
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
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200"
            >
              <p className="font-medium text-slate-900">{t.subject}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">{t.status}</span>
                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/support" className="text-sm font-medium text-violet-600 hover:text-violet-700">
          ← Back to Support
        </Link>
      </div>
    </div>
  );
}
