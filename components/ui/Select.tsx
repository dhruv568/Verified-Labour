import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = '',
      id,
      required,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`${fullWidth ? 'w-full' : ''} text-left`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-bold text-slate-700 mb-1.5"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={`w-full appearance-none px-3.5 py-2.5 pr-10 text-sm sm:text-xs rounded-xl border transition-all outline-none bg-white text-slate-900 ${
              error
                ? 'border-red-300 focus:ring-2 focus:ring-red-400 bg-red-50/20'
                : 'border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
            } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''} ${className}`}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
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

Select.displayName = 'Select';
export default Select;
