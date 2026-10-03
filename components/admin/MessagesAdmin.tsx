'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Loader2,
  Send,
  MessageSquare,
  User,
  Inbox,
  Filter,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MessageCounts {
  total: number;
  unread: number;
  read: number;
  responded: number;
}

type FilterTab = 'ALL' | 'UNREAD' | 'READ' | 'RESPONDED';

export default function MessagesAdmin() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState<MessageCounts>({
    total: 0,
    unread: 0,
    read: 0,
    responded: 0,
  });
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action Loading & Toast States per message ID
  const [readingId, setReadingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);

  const fetchMessages = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/admin/messages', window.location.origin);
      url.searchParams.set('filter', activeFilter);
      if (searchQuery) url.searchParams.set('search', searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch feedback messages.');
      }

      setMessages(data.messages || []);
      if (data.counts) setCounts(data.counts);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while fetching messages.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMessages();
  };

  // Handler: Mark Message as Read
  const handleMarkAsRead = async (id: string) => {
    setReadingId(id);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/admin/messages/${id}/read`, {
        method: 'PATCH',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to mark message as read.');
      }

      // Optimistically update local message list & counts
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, isRead: true } : msg))
      );

      setCounts((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
        read: prev.read + 1,
      }));

      setActionNotice({ id, type: 'success', text: 'Message marked as Read ✓' });
    } catch (err: any) {
      setActionNotice({ id, type: 'error', text: err.message || 'Failed to update read status.' });
    } finally {
      setReadingId(null);
    }
  };

  // Handler: Respond to Message via Email
  const handleRespond = async (id: string, name: string, email: string, isResponded: boolean) => {
    if (isResponded && !window.confirm(`A response was already sent to ${email}. Send another response email?`)) {
      return;
    }

    setRespondingId(id);
    setActionNotice(null);

    try {
      const res = await fetch(`/api/admin/messages/${id}/respond`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send confirmation email.');
      }

      const nowIso = new Date().toISOString();

      // Optimistically update local message status to Responded & Read
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === id ? { ...msg, isRead: true, respondedAt: nowIso } : msg
        )
      );

      setCounts((prev) => {
        const wasUnread = messages.find((m) => m.id === id)?.isRead === false;
        return {
          ...prev,
          unread: wasUnread ? Math.max(0, prev.unread - 1) : prev.unread,
          read: wasUnread ? prev.read : Math.max(0, prev.read - 1),
          responded: prev.responded + (isResponded ? 0 : 1),
        };
      });

      setActionNotice({ id, type: 'success', text: `Response email successfully sent to ${email}!` });
    } catch (err: any) {
      setActionNotice({ id, type: 'error', text: err.message || 'Failed to send response email.' });
    } finally {
      setRespondingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-2">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-[#08783b]" />
            Feedback & Customer Messages
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review user feedback, general inquiries, and send direct official response emails.
          </p>
        </div>

        <button
          onClick={() => fetchMessages(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition min-h-[44px] shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#08783b]' : ''}`} />
          <span>Refresh Messages</span>
        </button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Messages</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-950 mt-2">{counts.total}</div>
          <div className="text-xs text-slate-400 mt-1">All submitted form entries</div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-gradient-to-br from-amber-50/30 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Unread</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              !
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 mt-2">{counts.unread}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Requires admin review</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Read</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-2">{counts.read}</div>
          <div className="text-xs text-slate-500 mt-1">Reviewed by admin</div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-gradient-to-br from-emerald-50/30 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Responded</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-2">{counts.responded}</div>
          <div className="text-xs text-emerald-700 font-medium mt-1">Email sent to user</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(['ALL', 'UNREAD', 'READ', 'RESPONDED'] as FilterTab[]).map((tab) => {
            const isActive = activeFilter === tab;
            const count =
              tab === 'ALL'
                ? counts.total
                : tab === 'UNREAD'
                ? counts.unread
                : tab === 'READ'
                ? counts.read
                : counts.responded;

            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap min-h-[40px] flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-navy-950 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>
                  {tab === 'ALL'
                    ? 'All Messages'
                    : tab === 'UNREAD'
                    ? 'Unread'
                    : tab === 'READ'
                    ? 'Read'
                    : 'Responded'}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs">
          <input
            type="text"
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#08783b] min-h-[40px]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchMessages();
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content: Messages Card Stack */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 text-[#08783b] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Messages Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeFilter === 'UNREAD'
              ? 'There are no unread feedback messages at the moment.'
              : activeFilter === 'RESPONDED'
              ? 'No messages have been responded to yet.'
              : 'No contact or feedback submissions match your current search criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const isUnread = !msg.isRead;
            const isResponded = !!msg.respondedAt;
            const isReadOnly = msg.isRead && !isResponded;
            const isReadingThis = readingId === msg.id;
            const isRespondingThis = respondingId === msg.id;
            const notice = actionNotice?.id === msg.id ? actionNotice : null;

            return (
              <div
                key={msg.id}
                className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-md ${
                  isUnread
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-white'
                    : isResponded
                    ? 'border-emerald-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Notice message for this card */}
                {notice && (
                  <div
                    className={`mb-3 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                      notice.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {notice.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span>{notice.text}</span>
                  </div>
                )}

                {/* Top Header Row: User Info & Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-navy-950 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#08783b]" />
                        {msg.name}
                      </h3>
                      {isUnread && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          Unread
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <a
                        href={`mailto:${msg.email}`}
                        className="inline-flex items-center gap-1 text-[#1264D6] hover:underline font-semibold break-all"
                      >
                        <Mail className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        {msg.email}
                      </a>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <a
                        href={`tel:${msg.phone}`}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-[#08783b] font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                        {msg.phone}
                      </a>
                    </div>
                  </div>

                  {/* Status Badges & Timestamp */}
                  <div className="flex items-center sm:items-end flex-col gap-1 mt-1 sm:mt-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isResponded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>✓ Read ✓ Responded</span>
                        </span>
                      ) : isReadOnly ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                          <span>Read ✓</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Unread</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDate(msg.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Subject & Message Content Box */}
                <div className="py-3 space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="text-slate-400">Subject:</span>
                    <span className="text-navy-950 font-extrabold">{msg.subject || 'General Inquiry'}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs sm:text-sm text-slate-800 line-relaxed whitespace-pre-wrap break-words">
                    {msg.message}
                  </div>

                  {isResponded && (
                    <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Response email sent on {formatDate(msg.respondedAt!)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="pt-2 flex items-center justify-end gap-2.5 flex-wrap border-t border-slate-100">
                  {/* Read Button */}
                  {isUnread ? (
                    <button
                      onClick={() => handleMarkAsRead(msg.id)}
                      disabled={isReadingThis || isRespondingThis}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition min-h-[40px] shadow-sm disabled:opacity-50"
                    >
                      {isReadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#08783b]" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>Mark as Read</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 select-none">
                      Read ✓
                    </span>
                  )}

                  {/* Respond Button */}
                  <button
                    onClick={() => handleRespond(msg.id, msg.name, msg.email, isResponded)}
                    disabled={isRespondingThis || isReadingThis}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition min-h-[40px] shadow-sm disabled:opacity-50 ${
                      isResponded
                        ? 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200'
                        : 'bg-[#08783b] text-white hover:bg-[#065e2e]'
                    }`}
                  >
                    {isRespondingThis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isResponded ? 'Resend Response Email' : 'Respond'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
