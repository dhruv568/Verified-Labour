import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`${fullWidth ? 'w-full' : ''} text-left`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-bold text-slate-700 mb-1.5"
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          disabled={disabled}
          required={required}
          className={`w-full px-3.5 py-2.5 text-xs rounded-xl border transition-all outline-none bg-white text-slate-900 placeholder:text-slate-400 ${
            error
              ? 'border-red-300 focus:ring-2 focus:ring-red-400 bg-red-50/20'
              : 'border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500'
          } ${disabled ? 'bg-slate-100 opacity-60 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />

        {error ? (
          <p className="text-[11px] text-red-600 mt-1 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
