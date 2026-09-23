import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'brand' | 'amber' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      icon,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-bold rounded-xl transition-all select-none focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-navy-800 hover:bg-navy-900 text-white focus:ring-navy-800 shadow-sm',
      brand: 'bg-brand-700 hover:bg-brand-800 text-white focus:ring-brand-700 shadow-sm',
      amber: 'bg-amber-500 hover:bg-amber-600 text-navy-950 focus:ring-amber-500 shadow-sm',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-300',
      outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400 bg-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 shadow-sm',
      ghost: 'hover:bg-slate-100 text-slate-700 focus:ring-slate-200',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-xs px-4 py-2.5 gap-2',
      lg: 'text-sm px-5 py-3 gap-2.5',
    };

    const widthStyle = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
