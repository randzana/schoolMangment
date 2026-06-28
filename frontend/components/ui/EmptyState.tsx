import React from 'react';
import { HiOutlineInbox } from 'react-icons/hi2';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-border rounded-xl bg-white/50 max-w-md mx-auto my-8">
      <div className="p-4 rounded-full bg-surface-muted text-text-muted mb-4">
        {icon || <HiOutlineInbox className="w-10 h-10 text-text-light" />}
      </div>
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      <p className="text-xs text-text-muted mb-6 leading-relaxed max-w-xs">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
