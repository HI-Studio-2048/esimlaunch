'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthFetch } from '@/hooks/useAuthFetch';

interface Reply {
  id: string;
  body: string;
  isStaff?: boolean;
  senderType?: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  replies: Reply[];
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoaded, isSignedIn } = useUser();
  const { authFetch } = useAuthFetch();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !email || !id) return;
    setLoading(true);
    authFetch<TicketDetail>(`/support/tickets/${id}`)
      .then(setTicket)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, email, id, authFetch]);

  // Poll for new support replies every 15s when ticket is open
  useEffect(() => {
    if (!ticket || ticket.status === 'closed' || ticket.status === 'resolved' || !email || !id) return;
    const interval = setInterval(() => {
      authFetch<TicketDetail>(`/support/tickets/${id}`)
        .then(setTicket)
        .catch(() => {}); // Ignore poll errors
    }, 15_000);
    return () => clearInterval(interval);
  }, [ticket?.id, ticket?.status, id, email, authFetch]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !user?.primaryEmailAddress?.emailAddress) return;
    setSubmitting(true);
    setError(null);
    try {
      const reply = await authFetch<Reply>(`/support/tickets/${id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      setTicket((prev) => (prev ? { ...prev, replies: [...prev.replies, reply] } : prev));
      setReplyBody('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-ink-secondary">Please sign in to view this ticket.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-teal-400 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-surface-border border-t-teal-400" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-red-600">{error ?? 'Ticket not found'}</p>
        <Link href="/support/tickets" className="mt-4 inline-block text-teal-400 hover:underline">
          ← Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">{ticket.subject}</h1>
        <span className="badge-gray">
          {ticket.status}
        </span>
      </div>

      <div className="card p-6">
        <p className="text-ink-secondary">{ticket.body}</p>
        <p className="mt-4 text-xs text-ink-muted">
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      {ticket.replies.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="font-semibold text-ink">Replies</h2>
          {ticket.replies.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-card border p-4 ${
                reply.isStaff
                  ? 'border-teal-400/30 bg-teal-400/5'
                  : 'card'
              }`}
            >
              <p className="text-ink-secondary">{reply.body}</p>
              <p className="mt-2 text-xs text-ink-muted">
                {(reply.isStaff === true || (reply.senderType || '').toLowerCase() === 'merchant' || (reply.senderType || '').toLowerCase() === 'admin') ? 'Support' : 'You'} • {new Date(reply.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleReply} className="mt-8">
        <label className="mb-2 block font-medium text-ink-secondary">Add a reply</label>
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={4}
          placeholder="Type your message..."
          className="input w-full"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !replyBody.trim()}
          className="btn-primary mt-4 disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send Reply'}
        </button>
      </form>

      <div className="mt-8">
        <Link href="/support/tickets" className="text-sm font-medium text-teal-400 hover:text-teal-500">
          ← Back to tickets
        </Link>
      </div>
    </div>
  );
}
