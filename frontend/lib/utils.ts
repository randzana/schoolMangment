import { clsx, type ClassValue } from 'clsx';

/**
 * Merge class names (simplified — no tailwind-merge needed for v4)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a number as Iraqi Dinar currency with thousands separators.
 * No decimal places shown in UI (amounts are whole dinars).
 */
export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0 IQD';
  return `${Math.round(num).toLocaleString('en-US')} IQD`;
}

/**
 * Format a number with thousands separator (no currency suffix).
 */
export function formatNumber(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('en-US');
}

/**
 * Map grade key to display string.
 */
export const GRADE_MAP: Record<string, string> = {
  one: 'Grade 1',
  two: 'Grade 2',
  three: 'Grade 3',
  four: 'Grade 4',
  five: 'Grade 5',
};

export const GRADE_OPTIONS = [
  { value: 'one', label: 'Grade 1' },
  { value: 'two', label: 'Grade 2' },
  { value: 'three', label: 'Grade 3' },
  { value: 'four', label: 'Grade 4' },
  { value: 'five', label: 'Grade 5' },
];

export function gradeDisplay(grade: string): string {
  return GRADE_MAP[grade] || grade;
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Get current academic year string.
 */
export function getAcademicYear(): string {
  return process.env.NEXT_PUBLIC_ACADEMIC_YEAR || '2025-2026';
}

/**
 * Get school name.
 */
export function getSchoolName(): string {
  return process.env.NEXT_PUBLIC_SCHOOL_NAME || 'Al-Noor Private School';
}

/**
 * Item type display labels.
 */
export const ITEM_TYPE_MAP: Record<string, string> = {
  clothes: 'Clothes',
  book: 'Books',
  both: 'Clothes & Books',
};

/**
 * Payment status color classes.
 */
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'paid': return 'bg-emerald-100 text-emerald-800';
    case 'partial': return 'bg-amber-100 text-amber-800';
    case 'unpaid': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Get row balance color class for data tables.
 */
export function getBalanceRowClass(remaining: number | string, total: number | string): string {
  const rem = typeof remaining === 'string' ? parseFloat(remaining) : remaining;
  const tot = typeof total === 'string' ? parseFloat(total) : total;
  if (tot <= 0) return '';
  if (rem <= 0) return 'bg-emerald-50/50';
  if (rem < tot) return 'bg-amber-50/50';
  return 'bg-red-50/50';
}
