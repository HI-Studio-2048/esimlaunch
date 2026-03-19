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

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'open') return 'badge-glow';
  if (s === 'resolved' || s === 'closed') return 'badge-ghost';
  if (s === 'pending') return 'badge-amber';
  return 'badge-ghost';
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
        <p style={{ color: 'var(--text-muted)' }}>Please sign in to view this ticket.</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--border-bright)', borderTopColor: 'var(--electric)' }}
        />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p style={{ color: '#f87171' }}>{error ?? 'Ticket not found'}</p>
        <Link
          href="/support/tickets"
          className="mt-4 inline-block font-medium hover:underline"
          style={{ color: 'var(--electric)' }}
        >
          ← Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {ticket.subject}
        </h1>
        <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
      </div>

      {/* Original message */}
      <div className="card p-6">
        <p style={{ color: 'var(--text-muted)' }}>{ticket.body}</p>
        <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Replies */}
      {ticket.replies.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>Replies</h2>
          {ticket.replies.map((reply) => {
            const isSupport =
              reply.isStaff === true ||
              (reply.senderType || '').toLowerCase() === 'merchant' ||
              (reply.senderType || '').toLowerCase() === 'admin';
            return (
              <div
                key={reply.id}
                className="rounded-card border p-4"
                style={{
                  borderColor: isSupport ? 'rgba(0,229,192,0.2)' : 'var(--border)',
                  background: isSupport ? 'rgba(0,229,192,0.05)' : 'var(--night-50)',
                }}
              >
                <p style={{ color: 'var(--text-muted)' }}>{reply.body}</p>
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                  {isSupport ? 'Support' : 'You'} &bull; {new Date(reply.createdAt).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Reply form */}
      <form onSubmit={handleReply} className="mt-8">
        <label className="mb-2 block font-medium" style={{ color: 'var(--text-muted)' }}>
          Add a reply
        </label>
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={4}
          placeholder="Type your message..."
          className="input w-full resize-none"
        />
        {error && (
          <p className="mt-2 text-sm" style={{ color: '#f87171' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting || !replyBody.trim()}
          className="btn-primary mt-4 disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send Reply'}
        </button>
      </form>

      <div className="mt-8">
        <Link
          href="/support/tickets"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--electric)' }}
        >
          ← Back to tickets
        </Link>
      </div>
    </div>
  );
}
