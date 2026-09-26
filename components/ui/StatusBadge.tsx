import React from 'react';
import { CheckCircle2, Clock, AlertCircle, ShieldCheck, XCircle, UserCheck } from 'lucide-react';
import Badge from './Badge';

export interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className = '', size = 'md' }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
    case 'PAID':
    case 'REVIEWED':
    case 'VERIFIED':
      return (
        <Badge variant="brand" size={size} className={className}>
          <CheckCircle2 className="w-3 h-3 text-brand-600" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'WORKER_ON_THE_WAY':
    case 'ARRIVED':
    case 'WORK_STARTED':
      return (
        <Badge variant="info" size={size} className={className}>
          <Clock className="w-3 h-3 text-blue-600" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'ACCEPTED':
    case 'SCHEDULED':
    case 'PAYMENT_PENDING':
    case 'PENDING_REVIEW':
    case 'PENDING':
      return (
        <Badge variant="warning" size={size} className={className}>
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'REQUESTED':
    case 'ONBOARDING':
      return (
        <Badge variant="neutral" size={size} className={className}>
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'BLOCKED':
    case 'CANCELLED_BY_CUSTOMER':
    case 'CANCELLED_BY_WORKER':
    case 'REJECTED':
    case 'FAILED':
    case 'SUSPENDED':
      return (
        <Badge variant="danger" size={size} className={className}>
          <XCircle className="w-3 h-3 text-red-600" />
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );

    case 'DISPUTED':
      return (
        <Badge variant="danger" size={size} className={className}>
          <AlertCircle className="w-3 h-3 text-red-600" />
          <span>DISPUTED</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="neutral" size={size} className={className}>
          <span>{normalized.replace(/_/g, ' ')}</span>
        </Badge>
      );
  }
}

export default StatusBadge;
