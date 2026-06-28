'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineArrowUpTray, HiOutlineDocumentText } from 'react-icons/hi2';

interface ExportDropdownProps {
  onExportCsv: () => void;
  onPrint?: () => void;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportCsv,
  onPrint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-border text-sm font-semibold rounded-lg bg-white text-text-muted hover:text-text hover:bg-surface-muted transition-colors cursor-pointer"
      >
        <HiOutlineArrowUpTray className="w-4 h-4" />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+4px)] w-40 rounded-lg shadow-lg bg-white border border-border ring-1 ring-black/5 z-50 py-1">
          <button
            onClick={() => {
              onExportCsv();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-muted transition-colors text-left cursor-pointer"
          >
            <HiOutlineDocumentText className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
          {onPrint && (
            <button
              onClick={() => {
                onPrint();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-muted transition-colors text-left cursor-pointer"
            >
              <HiOutlineDocumentText className="w-4 h-4" />
              <span>Print view</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
