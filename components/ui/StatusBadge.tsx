import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, MinusCircle, AlertCircle } from 'lucide-react';
import Badge from './Badge';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase().trim();

  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
    case 'PAID':
    case 'REVIEWED':
    case 'VERIFIED':
      return (
        <Badge variant="success" size={size} className={className}>
          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'PENDING_VERIFICATION':
    case 'PENDING VERIFICATION':
    case 'PENDING_REVIEW':
    case 'PENDING':
    case 'ACCEPTED':
    case 'SCHEDULED':
    case 'PAYMENT_PENDING':
      return (
        <Badge variant="warning" size={size} className={className}>
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'SUSPENDED':
      return (
        <Badge variant="orange" size={size} className={className}>
          <AlertTriangle className="w-3 h-3 text-orange-600 shrink-0" />
          <span>SUSPENDED</span>
        </Badge>
      );

    case 'BLOCKED':
    case 'REJECTED':
    case 'FAILED':
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_WORKER':
      return (
        <Badge variant="danger" size={size} className={className}>
          <XCircle className="w-3 h-3 text-red-600 shrink-0" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'INACTIVE':
      return (
        <Badge variant="neutral" size={size} className={className}>
          <MinusCircle className="w-3 h-3 text-slate-500 shrink-0" />
          <span>INACTIVE</span>
        </Badge>
      );

    case 'WORKER_ON_THE_WAY':
    case 'ARRIVED':
    case 'WORK_STARTED':
      return (
        <Badge variant="info" size={size} className={className}>
          <Clock className="w-3 h-3 text-blue-600 shrink-0" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'REQUESTED':
    case 'ONBOARDING':
      return (
        <Badge variant="neutral" size={size} className={className}>
          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'DISPUTED':
      return (
        <Badge variant="danger" size={size} className={className}>
          <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
          <span>DISPUTED</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" size={size} className={className}>
          <MinusCircle className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );
  }
}

export default StatusBadge;
