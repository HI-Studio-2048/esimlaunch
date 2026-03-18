'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';
import { useAuthFetch } from '@/hooks/useAuthFetch';

export default function NewTicketPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch } = useAuthFetch();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    const userEmail = user?.primaryEmailAddress?.emailAddress ?? email.trim();
    if (!userEmail) {
      setError('Please enter your email or sign in.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchFn = isSignedIn ? authFetch : apiFetch;
      const ticket = await fetchFn<{ id: string }>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          ...(isSignedIn ? {} : { email: email.trim() }),
        }),
      });
      router.push(`/support/tickets/${ticket.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Failed to create ticket.');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-slate-900">Create Support Ticket</h1>
      <p className="mt-4 text-slate-600">
        Describe your issue and we&apos;ll get back to you as soon as possible.
      </p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-6">
        {!isSignedIn && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900"
            />
          </div>
        )}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="Brief summary of your issue"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={6}
            placeholder="Please describe your issue in detail..."
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-violet-600 px-6 py-2.5 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Ticket'}
          </button>
          <Link
            href="/support/tickets"
            className="rounded-xl border border-slate-200 px-6 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
