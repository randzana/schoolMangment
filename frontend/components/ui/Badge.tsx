import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'warning' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
  const variants = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-surface-muted text-text-muted border border-border',
    accent: 'bg-accent/15 text-amber-800',
    danger: 'bg-danger/10 text-danger',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-orange-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
