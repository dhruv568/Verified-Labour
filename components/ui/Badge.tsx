import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'orange' | 'danger' | 'info' | 'neutral' | 'navy';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  className = '',
  variant = 'neutral',
  size = 'md',
  ...props
}: BadgeProps) {
  const variants = {
    brand: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    orange: 'bg-orange-50 text-orange-900 border-orange-300',
    danger: 'bg-red-50 text-red-800 border-red-300',
    info: 'bg-blue-50 text-blue-800 border-blue-300',
    neutral: 'bg-slate-100 text-slate-700 border-slate-300',
    navy: 'bg-navy-900 text-white border-navy-800',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full border tracking-wide uppercase font-mono ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
