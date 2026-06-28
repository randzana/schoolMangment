'use client';

import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

interface TablePaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  total: number;
  perPage: number;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  lastPage,
  onPageChange,
  total,
  perPage,
}) => {
  if (lastPage <= 1) return null;

  const startIdx = (currentPage - 1) * perPage + 1;
  const endIdx = Math.min(currentPage * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-border bg-white rounded-b-xl">
      <div className="text-xs text-text-muted">
        Showing <span className="font-semibold text-text">{startIdx}</span> to{' '}
        <span className="font-semibold text-text">{endIdx}</span> of{' '}
        <span className="font-semibold text-text">{total}</span> records
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-border bg-white text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="Previous page"
        >
          <HiChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: lastPage }).map((_, idx) => {
          const p = idx + 1;
          const isCurrent = p === currentPage;

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-primary text-white'
                  : 'border border-border bg-white text-text-muted hover:bg-surface-muted hover:text-text'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="p-1.5 rounded-lg border border-border bg-white text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
          aria-label="Next page"
        >
          <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
