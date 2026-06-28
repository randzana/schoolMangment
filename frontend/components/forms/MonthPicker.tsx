'use client';

import React from 'react';
import { Input } from '../ui/Input';

interface MonthPickerProps {
  label?: string;
  value: string; // 'YYYY-MM'
  onChange: (value: string) => void;
  error?: string;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  label,
  value,
  onChange,
  error,
}) => {
  return (
    <Input
      label={label}
      error={error}
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};
