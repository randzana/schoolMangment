import React from 'react';
import { Skeleton } from '../ui/Skeleton';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ columns, rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-border shadow-card p-4 space-y-4">
      {/* Table header skeleton */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, idx) => (
          <Skeleton key={idx} height="20px" />
        ))}
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div 
          key={rIdx} 
          className="grid gap-4 pt-4 border-t border-border" 
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, cIdx) => (
            <Skeleton key={cIdx} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
};
