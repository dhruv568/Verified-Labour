import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      prefixText,
      icon,
      fullWidth = true,
      className = '',
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`${fullWidth ? 'w-full' : ''} text-left`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-slate-700 mb-1.5"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div
          className={`flex items-center rounded-xl border transition-all overflow-hidden ${
            error
              ? 'border-red-300 focus-within:ring-2 focus-within:ring-red-400 bg-red-50/20'
              : 'border-slate-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 bg-white'
          } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''}`}
        >
          {prefixText && (
            <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-300 select-none">
              {prefixText}
            </span>
          )}

          {icon && <span className="pl-3 text-slate-400 shrink-0">{icon}</span>}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={`w-full px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none bg-transparent ${className}`}
            {...props}
          />
        </div>

        {error ? (
          <p className="text-[11px] text-red-600 mt-1 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
