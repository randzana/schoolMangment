'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineXMark, HiOutlineArrowsPointingOut, HiOutlineArrowsPointingIn } from 'react-icons/hi2';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full';
  /** Show a button in the header that enlarges the modal to fill the screen. */
  expandable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  expandable = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen || !mounted) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full m-4 h-[calc(100vh-2rem)]',
  };

  const sizeClass = expandable && isExpanded
    ? 'max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-2rem)]'
    : sizes[size];

  const modalElement = (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className={`w-full bg-white rounded-xl shadow-lg flex flex-col overflow-hidden my-4 sm:my-auto max-h-[calc(100vh-2rem)] sm:max-h-[90vh] ${sizeClass} transition-all animate-slide-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted">
          <h3 className="font-semibold text-base text-text">{title}</h3>
          <div className="flex items-center gap-1">
            {expandable && (
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-gray-200 transition-colors cursor-pointer"
                aria-label={isExpanded ? 'بچووککردنەوەی شاشە' : 'گەورەکردنی شاشە'}
                title={isExpanded ? 'بچووککردنەوەی شاشە' : 'گەورەکردنی شاشە'}
              >
                {isExpanded ? <HiOutlineArrowsPointingIn className="w-5 h-5" /> : <HiOutlineArrowsPointingOut className="w-5 h-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-text leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
};
