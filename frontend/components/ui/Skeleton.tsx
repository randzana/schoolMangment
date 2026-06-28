import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  height,
  width,
}) => {
  const styles = {
    text: 'h-4 w-full rounded',
    rect: 'h-24 w-full rounded-lg',
    circle: 'h-12 w-12 rounded-full',
  };

  return (
    <div
      className={`animate-shimmer bg-gray-200 ${styles[variant]} ${className}`}
      style={{ height, width }}
    />
  );
};
