'use client';

import React from 'react';
import { Input } from '../ui/Input';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  error,
  value,
  onChange,
  className = '',
  ...props
}) => {
  // Format numeric value for display
  const displayValue = value === 0 ? '' : value.toLocaleString('en-US');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/,/g, '');
    const numVal = rawVal === '' ? 0 : parseFloat(rawVal);
    if (!isNaN(numVal)) {
      onChange(numVal);
    }
  };

  return (
    <Input
      label={label}
      error={error}
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={`font-mono text-right ${className}`}
      {...props}
    />
  );
};
