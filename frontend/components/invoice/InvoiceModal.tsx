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
  const handlePrint = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${invoiceNo}`} size="lg">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-text-muted leading-relaxed">
          The payment has been recorded successfully. You can preview the receipt below or click Print to open in a new tab.
        </p>

        {invoiceUrl && (
          <div className="w-full h-96 border rounded-lg overflow-hidden bg-surface-muted relative">
            <iframe
              src={invoiceUrl}
              className="w-full h-full"
              title={`Invoice #${invoiceNo} PDF Preview`}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} className="flex items-center gap-1.5">
            <HiOutlinePrinter className="w-4 h-4" />
            <span>Open & Print PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
