'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, type = 'text', id, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={id}
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light disabled:bg-surface-muted disabled:text-text-muted ${
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-danger font-medium animate-fade-in">{error}</span>
        )}
        {helperText && !error && (
          <span className="text-xs text-text-muted">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
