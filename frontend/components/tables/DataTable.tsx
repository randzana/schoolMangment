'use client';

import React, { useState } from 'react';
import { HiArrowsUpDown } from 'react-icons/hi2';
import { Spinner } from '../ui/Spinner';
import { EmptyState } from '../ui/EmptyState';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  rowClass?: (row: T) => string;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  isLoading,
  onRowClick,
  emptyState,
  rowClass,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    
    const key = column.header;
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Sort data client-side if needed (fallback/simple cases)
  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    const activeColumn = columns.find((col) => col.header === sortKey);
    if (!activeColumn) return data;

    return [...data].sort((a, b) => {
      let valA = typeof activeColumn.accessor === 'function' 
        ? activeColumn.accessor(a) 
        : a[activeColumn.accessor as keyof T];
      let valB = typeof activeColumn.accessor === 'function' 
        ? activeColumn.accessor(b) 
        : b[activeColumn.accessor as keyof T];

      if (typeof valA === 'function') return 0;
      if (typeof valB === 'function') return 0;

      // Handle null/undefined
      if (valA === null || valA === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (valB === null || valB === undefined) return sortOrder === 'asc' ? -1 : 1;

      // Avoid sorting complex React elements/objects
      if (typeof valA === 'object' || typeof valB === 'object') return 0;

      // Type checks
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
      if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortOrder, columns]);

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20 bg-white rounded-xl border border-border shadow-card">
        <Spinner size="lg" />
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-border shadow-card py-10">
        {emptyState || (
          <EmptyState
            title="No records found"
            description="There are no items matching this criteria."
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-border shadow-card overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col)}
                  className={`${col.className || ''} ${col.sortable ? 'select-none cursor-pointer' : ''}`}
                >
                  <div className="flex items-center gap-1.5 justify-start">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <HiArrowsUpDown className="w-3.5 h-3.5 text-text-light" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick && onRowClick(row)}
                className={`${onRowClick ? 'cursor-pointer' : ''} ${rowClass ? rowClass(row) : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={col.className || ''}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
