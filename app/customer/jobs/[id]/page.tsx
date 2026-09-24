'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  CreditCard,
  Star,
  AlertCircle,
  ShieldCheck,
  Send,
  X,
  Phone,
} from 'lucide-react';

export default function CustomerJobTrackerPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: jobId } = params;
  const [job, setJob] = useState<any>(null);
  const [allowedActions, setAllowedActions] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  // Cashfree Payment States
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatusState, setPaymentStatusState] = useState<'PENDING' | 'SUCCESS' | 'FAILED' | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>('');

  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load job');

      setJob(data.job);
      setAllowedActions(data.actionableNextStatuses || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?jobId=${jobId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch {}
  };

  // Server-side Cashfree Payment Verification
  const verifyCashfreePayment = async (orderId: string) => {
    try {
      setPaymentLoading(true);
      setPaymentStatusState('PENDING');
      setPaymentStatusMessage("We're confirming your payment. Please wait.");

      const resVerify = await fetch('/api/payments/cashfree/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, orderId }),
      });

      const verifyData = await resVerify.json();

      if (verifyData.success) {
        setPaymentStatusState('SUCCESS');
        setPaymentStatusMessage('Your booking has been confirmed.');
        await fetchJob();
      } else if (verifyData.status === 'PENDING') {
        setPaymentStatusState('PENDING');
        setPaymentStatusMessage("We're confirming your payment. Please wait.");
      } else {
        setPaymentStatusState('FAILED');
        setPaymentStatusMessage(verifyData.error || 'Payment verification failed. Please try again.');
      }
    } catch (err: any) {
      setPaymentStatusState('FAILED');
      setPaymentStatusMessage('Verification error: ' + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    fetchMessages();

    // Check for Cashfree return redirect with order_id in query params
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlOrderId = searchParams.get('order_id');
      if (urlOrderId) {
        verifyCashfreePayment(urlOrderId);
      }
    }

    const interval = setInterval(() => {
      fetchJob();
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, content: newMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMsg('');
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pay via Cashfree Payments
  const handlePayNow = async () => {
    try {
      setPaymentLoading(true);
      setPaymentStatusState('PENDING');
      setPaymentStatusMessage('Creating secure payment order with Cashfree...');

      const resOrder = await fetch('/api/payments/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const orderData = await resOrder.json();
      if (!resOrder.ok || !orderData.success) {
        setPaymentStatusState('FAILED');
        setPaymentStatusMessage(orderData.error || 'Failed to initialize Cashfree payment.');
        setPaymentLoading(false);
        return;
      }

      const { paymentSessionId, orderId, environment } = orderData;

      // In mock / development test mode
      if (paymentSessionId.startsWith('session_mock_')) {
        await verifyCashfreePayment(orderId);
        return;
      }

      // Initialize Cashfree Payments JS SDK (v3)
      try {
        const { load } = await import('@cashfreepayments/cashfree-js');
        const cashfree = await load({
          mode: environment?.toLowerCase() === 'production' ? 'production' : 'sandbox',
        });

        setPaymentStatusMessage('Opening Cashfree Checkout...');

        const checkoutResult = await cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_modal',
        });

        if (checkoutResult?.error) {
          setPaymentStatusState('FAILED');
          setPaymentStatusMessage(checkoutResult.error.message || 'Payment was cancelled or failed. Please try again.');
          setPaymentLoading(false);
          return;
        }

        // Verify payment on backend
        await verifyCashfreePayment(orderId);
      } catch (sdkErr: any) {
        console.warn('Cashfree SDK modal fallback to server verification:', sdkErr);
        await verifyCashfreePayment(orderId);
      }
    } catch (err: any) {
      setPaymentStatusState('FAILED');
      setPaymentStatusMessage('Payment error: ' + err.message);
      setPaymentLoading(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to submit review');

      setReviewSuccess(true);
      fetchJob();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading && !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="max-w-md mx-auto my-auto p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Job Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'This job request does not exist.'}</p>
          <Link href="/customer/dashboard" className="inline-block px-4 py-2 bg-brand-700 text-white rounded-xl text-xs font-bold">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'WORKER_ON_THE_WAY', label: 'On The Way' },
    { key: 'ARRIVED', label: 'Arrived' },
    { key: 'WORK_STARTED', label: 'In Progress' },
    { key: 'WORK_COMPLETED', label: 'Completed' },
    { key: 'PAID', label: 'Paid' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === job.status);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Breadcrumb & Job ID */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/customer/dashboard" className="text-xs font-semibold text-brand-700 hover:underline">
              ← Back to My Bookings
            </Link>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              Job Tracking: #{job.id.slice(0, 8).toUpperCase()}
            </h1>
          </div>
          <span className="px-3 py-1 bg-brand-100 text-brand-800 text-xs font-bold rounded-full border border-brand-200">
            {job.status}
          </span>
        </div>

        {/* State Machine Progress Bar */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {steps.map((st, i) => {
              const isPast = currentIdx >= i;
              const isCurrent = job.status === st.key;
              return (
                <div key={st.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                      isCurrent
                        ? 'bg-brand-700 text-white ring-4 ring-brand-100'
                        : isPast
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[11px] font-bold ${isCurrent ? 'text-brand-700' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content: Details + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Job & Worker Card */}
          <div className="lg:col-span-7 space-y-6">
            {/* Worker Info */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Assigned Professional
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-800 font-bold text-lg flex items-center justify-center">
                    {job.worker.fullName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                      {job.worker.fullName}
                      <CheckCircle2 className="w-4 h-4 text-brand-600 fill-brand-600 text-white" />
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {job.worker.primaryCategory?.name} Specialist
                    </p>
                    {job.status !== 'REQUESTED' && (
                      <p className="text-xs font-bold text-brand-700 flex items-center gap-1 mt-1">
                        <Phone className="w-3.5 h-3.5" /> {job.worker.user.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Total Amount</span>
                  <span className="text-xl font-black text-navy-900">₹{job.finalAmount}</span>
                </div>
              </div>

              {/* Service & Location */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <p>
                  <strong className="text-slate-800">Service:</strong> {job.service.name}
                </p>
                <p>
                  <strong className="text-slate-800">Requirement:</strong> {job.jobRequest.description}
                </p>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                  <span>{job.jobRequest.formattedAddress}</span>
                </p>
              </div>

              {/* Action Buttons: Pay Now if WORK_COMPLETED or PAYMENT_PENDING */}
              {['WORK_COMPLETED', 'PAYMENT_PENDING'].includes(job.status) && (
                <div className="p-4 bg-brand-50 border border-brand-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-brand-900">Work Marked Complete!</p>
                      <p className="text-[11px] text-brand-700">Please pay ₹{job.finalAmount} securely via Cashfree Payments (UPI, Cards, NetBanking).</p>
                    </div>
                    <button
                      onClick={handlePayNow}
                      disabled={paymentLoading}
                      className="px-5 py-2.5 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <CreditCard className="w-4 h-4" />
                      {paymentLoading ? 'Processing...' : `Proceed to Payment (₹${job.finalAmount})`}
                    </button>
                  </div>

                  {/* Cashfree Payment Status Display */}
                  {paymentStatusState && (
                    <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                      paymentStatusState === 'SUCCESS'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : paymentStatusState === 'PENDING'
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-red-50 border-red-200 text-red-900'
                    }`}>
                      {paymentStatusState === 'SUCCESS' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {paymentStatusState === 'PENDING' && (
                        <Clock className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                      )}
                      {paymentStatusState === 'FAILED' && (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-bold">
                          {paymentStatusState === 'SUCCESS' && 'Payment Successful'}
                          {paymentStatusState === 'PENDING' && 'Payment Processing'}
                          {paymentStatusState === 'FAILED' && 'Payment Failed'}
                        </p>
                        <p className="text-[11px] mt-0.5">
                          {paymentStatusMessage || (
                            paymentStatusState === 'SUCCESS'
                              ? 'Your booking has been confirmed.'
                              : paymentStatusState === 'PENDING'
                              ? "We're confirming your payment. Please wait."
                              : 'Please try again.'
                          )}
                        </p>
                      </div>
                      {paymentStatusState === 'FAILED' && (
                        <button
                          type="button"
                          onClick={handlePayNow}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] rounded-lg transition-colors shrink-0"
                        >
                          Try Again
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Review Box if PAID */}
              {['PAID', 'REVIEWED', 'COMPLETED'].includes(job.status) && !job.review && !reviewSuccess && (
                <form onSubmit={handleSubmitReview} className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Rate & Review {job.worker.fullName}</h4>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-amber-500"
                      >
                        <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Share your experience (punctuality, quality of work)..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white outline-none resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-navy-950 font-bold text-xs rounded-xl shadow-sm transition-colors"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit 5-Star Review'}
                  </button>
                </form>
              )}

              {job.review && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-800">Your Review: ★ {job.review.rating}.0</span>
                  <p className="text-slate-600 italic">"{job.review.comment}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: In-App Chat */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
              {/* Chat Header */}
              <div className="p-4 bg-navy-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-400" />
                  <span className="font-bold text-xs">Direct Job Chat</span>
                </div>
                <span className="text-[10px] text-brand-300">Live with Worker</span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-12">
                    No messages yet. Send a message to confirm tools or landmark.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderRole === 'CUSTOMER';
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs ${
                            isMe
                              ? 'bg-brand-700 text-white rounded-tr-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                          }`}
                        >
                          <p>{m.content}</p>
                          <span className={`text-[9px] block mt-1 ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim()}
                  className="p-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
