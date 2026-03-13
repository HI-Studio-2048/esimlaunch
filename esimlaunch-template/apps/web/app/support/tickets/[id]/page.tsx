'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/apiClient';

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
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.primaryEmailAddress?.emailAddress;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !email || !id) return;
    setLoading(true);
    apiFetch<TicketDetail>(`/support/tickets/${id}`, { userEmail: email })
      .then(setTicket)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, email, id]);

  // Poll for new support replies every 15s when ticket is open
  useEffect(() => {
    if (!ticket || ticket.status === 'closed' || ticket.status === 'resolved' || !email || !id) return;
    const interval = setInterval(() => {
      apiFetch<TicketDetail>(`/support/tickets/${id}`, { userEmail: email })
        .then(setTicket)
        .catch(() => {}); // Ignore poll errors
    }, 15_000);
    return () => clearInterval(interval);
  }, [ticket?.id, ticket?.status, id, email]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !user?.primaryEmailAddress?.emailAddress) return;
    setSubmitting(true);
    setError(null);
    try {
      const reply = await apiFetch<Reply>(`/support/tickets/${id}/replies`, {
        method: 'POST',
        body: JSON.stringify({ body: replyBody.trim() }),
        userEmail: user.primaryEmailAddress.emailAddress,
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
        <p className="text-slate-600">Please sign in to view this ticket.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-violet-600 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="text-red-600">{error ?? 'Ticket not found'}</p>
        <Link href="/support/tickets" className="mt-4 inline-block text-violet-600 hover:underline">
          ← Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{ticket.subject}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {ticket.status}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-slate-700">{ticket.body}</p>
        <p className="mt-4 text-xs text-slate-500">
          {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      {ticket.replies.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="font-semibold text-slate-900">Replies</h2>
          {ticket.replies.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-xl border p-4 ${reply.isStaff ? 'border-violet-200 bg-violet-50/50' : 'border-slate-200 bg-white'}`}
            >
              <p className="text-slate-700">{reply.body}</p>
              <p className="mt-2 text-xs text-slate-500">
                {(reply.isStaff === true || (reply.senderType || '').toLowerCase() === 'merchant' || (reply.senderType || '').toLowerCase() === 'admin') ? 'Support' : 'You'} • {new Date(reply.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleReply} className="mt-8">
        <label className="mb-2 block font-medium text-slate-700">Add a reply</label>
        <textarea
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          rows={4}
          placeholder="Type your message..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !replyBody.trim()}
          className="mt-4 rounded-xl bg-violet-600 px-6 py-2.5 font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send Reply'}
        </button>
      </form>

      <div className="mt-8">
        <Link href="/support/tickets" className="text-sm font-medium text-violet-600 hover:text-violet-700">
          ← Back to tickets
        </Link>
      </div>
    </div>
  );
}
