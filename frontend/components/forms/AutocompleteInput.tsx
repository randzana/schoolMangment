'use client';

import React, { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import type { StudentSearch } from '@/types';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';

interface AutocompleteInputProps {
  onSelect: (student: StudentSearch) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  defaultValue?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  onSelect,
  placeholder = 'Search by name or serial number...',
  label,
  error,
  defaultValue = '',
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<StudentSearch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/students-search?q=${encodeURIComponent(query)}`);
        setSuggestions(res.data.data);
      } catch (err) {
        console.error('Failed searching students', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        selectItem(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectItem = (student: StudentSearch) => {
    setQuery(student.full_name);
    setSuggestions([]);
    setIsOpen(false);
    onSelect(student);
  };

  return (
    <div ref={wrapperRef} className="relative w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-text">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light ${
            error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''
          }`}
        />
        <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-5 h-5 text-text-light" />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-primary border-r-transparent border-b-2 border-l-transparent" />
          </div>
        )}
      </div>

      {error && (
        <span className="text-xs text-danger font-medium animate-fade-in">{error}</span>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto py-1">
          {suggestions.map((student, idx) => (
            <li
              key={student.id}
              onClick={() => selectItem(student)}
              className={`px-4 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                idx === activeIndex ? 'bg-primary-light/10 text-primary font-medium' : 'hover:bg-surface-muted text-text'
              }`}
            >
              <div>
                <span className="font-semibold">{student.serial_number}</span>
                <span className="mx-2 text-text-light">•</span>
                <span>{student.full_name}</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-text-muted bg-surface-muted px-1.5 py-0.5 rounded border">
                {student.grade_display}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
