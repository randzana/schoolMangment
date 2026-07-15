'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { HiOutlinePrinter } from 'react-icons/hi2';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNo: number | string | null;
  invoiceUrl: string | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceNo,
  invoiceUrl,
}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const secureUrl = invoiceUrl && token
    ? `${invoiceUrl}${invoiceUrl.includes('?') ? '&' : '?' }token=${token}`
    : invoiceUrl;

  const handlePrint = () => {
    if (invoiceUrl) {
      const separator = invoiceUrl.includes('?') ? '&' : '?';
      window.open(`${invoiceUrl}${separator}t=${Date.now()}`, '_blank');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`پسوولەی ژمارە #${invoiceNo}`} size="lg">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-text-muted leading-relaxed">
          پارەدانەکە بە سەرکەوتوویی تۆمارکرا. دەتوانیت لە خوارەوە پێشبینی پسوولەکە بکەیت یان کرتە لەسەر چاپ بکەیت بۆ کردنەوەی لە پەڕەیەکی نوێدا.
        </p>

        {secureUrl && (
          <div className="w-full h-96 border rounded-lg overflow-hidden bg-surface-muted relative">
            <iframe
              src={`${secureUrl}${secureUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
              className="w-full h-full"
              title={`Invoice #${invoiceNo} Preview`}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 font-semibold">
          <Button variant="secondary" onClick={onClose}>
            داخستن
          </Button>
          <Button variant="primary" onClick={handlePrint} className="flex items-center gap-1.5">
            <HiOutlinePrinter className="w-4 h-4" />
            <span>چاپکردنی پسوولە</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
