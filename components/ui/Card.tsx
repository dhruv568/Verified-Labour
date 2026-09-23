import React, { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'muted' | 'interactive' | 'navy';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-white border border-slate-200 shadow-xs text-slate-900',
    muted: 'bg-slate-50 border border-slate-200 text-slate-800',
    interactive:
      'bg-white border border-slate-200 shadow-xs hover:border-brand-400 hover:shadow-md transition-all cursor-pointer text-slate-900',
    navy: 'bg-navy-900 border border-navy-800 text-white shadow-md',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden ${variants[variant]} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
