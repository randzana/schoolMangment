'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useStudyInstallments, useCreateStudyInstallment, useReturnStudyInstallment } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import { HiOutlinePrinter, HiOutlineTrash, HiOutlineArrowUturnLeft } from 'react-icons/hi2';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const installmentSchema = zod.object({
  study_payment_id: zod.number().min(1, 'Select a student with a configured payment plan'),
  amount_paid: zod.number().min(1, 'Amount paid must be greater than 0'),
  payment_date: zod.string().min(1, 'Payment date is required'),
  notes: zod.string().optional(),
});

type InstallmentFormValues = zod.infer<typeof installmentSchema>;

export default function StudyInstallmentsPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  
  // Invoice state
  const [invoiceNo, setInvoiceNo] = useState<number | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  
  // Return bill state
  const [returnId, setReturnId] = useState<number | null>(null);

  const { data: installmentsData, isLoading } = useStudyInstallments({ page });
  const createMutation = useCreateStudyInstallment();
  const returnMutation = useReturnStudyInstallment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InstallmentFormValues>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
    },
  });

  const amountPaid = watch('amount_paid') || 0;

  // Reactively calculate remain_after based on amount_paid input
  const remainBefore = selectedPayment ? parseFloat(selectedPayment.remain_balance) : 0;
  const remainAfter = Math.max(0, remainBefore - amountPaid);
  const beginPaid = selectedPayment ? (parseFloat(selectedPayment.price_after_discount) - remainAfter) : 0;

  const handleStudentSelect = async (student: any) => {
    setSelectedStudent(student);
    try {
      // Find the student's current year payment configuration
      const res = await api.get(`/study-payments?search=${encodeURIComponent(student.serial_number)}`);
      const payment = res.data.data[0];
      
      if (payment) {
        setSelectedPayment(payment);
        setValue('study_payment_id', payment.id);
      } else {
        setSelectedPayment(null);
        setValue('study_payment_id', 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = (values: InstallmentFormValues) => {
    if (selectedPayment && values.amount_paid > parseFloat(selectedPayment.remain_balance)) {
      alert(`Payment exceeds the remaining balance of ${selectedPayment.remain_balance} IQD`);
      return;
    }

    createMutation.mutate(values, {
      onSuccess: (res) => {
        const created = res.data;
        setInvoiceNo(created.invoice_no);
        setInvoiceUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/study-installments/${created.id}/invoice`);
        setIsInvoiceOpen(true);
        
        // Reset form
        setSelectedStudent(null);
        setSelectedPayment(null);
        reset({
          study_payment_id: 0,
          amount_paid: 0,
          payment_date: new Date().toISOString().split('T')[0],
          notes: '',
        });
      },
    });
  };

  const handleReturnConfirm = () => {
    if (returnId) {
      returnMutation.mutate(returnId, {
        onSuccess: () => setReturnId(null),
      });
    }
  };

  const columns: Column<any>[] = [
    { header: 'Invoice No', accessor: (row) => `#${row.invoice_no}`, sortable: true },
    { header: 'Date', accessor: (row) => formatDate(row.payment_date), sortable: true },
    { header: 'Student Name', accessor: (row) => row.student?.full_name },
    { header: 'Grade', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'Amount Paid', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-primary font-bold' },
    { header: 'Remaining After', accessor: (row) => formatCurrency(row.remain_after), className: 'text-danger' },
    {
      header: 'Returned',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
          {row.is_returned ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/study-installments/${row.id}/invoice`, '_blank')}
            title="Re-Print Invoice"
          >
            <HiOutlinePrinter className="w-4 h-4" />
          </Button>
          {!row.is_returned && user?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-light"
              onClick={() => setReturnId(row.id)}
              title="Void / Return Bill"
            >
              <HiOutlineArrowUturnLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">Study Installments</h1>
        <p className="text-xs text-text-muted">Record and verify individual student tuition payments</p>
      </div>

      {/* Entry Form (Top Section) */}
      <div className="bg-white border border-border p-6 rounded-xl shadow-card space-y-6">
        <h3 className="font-semibold text-sm text-text border-b pb-2">Record Installment Transaction</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 items-end">
          {/* Autocomplete Search */}
          <div className="sm:col-span-2">
            <AutocompleteInput
              label="Select Student *"
              onSelect={handleStudentSelect}
              error={errors.study_payment_id?.message}
            />
          </div>

          {/* Grade Display */}
          <Input
            label="Grade"
            id="student-grade"
            value={selectedStudent ? GRADE_MAP[selectedStudent.grade] || selectedStudent.grade : ''}
            disabled
            className="bg-surface-muted"
          />

          {/* Date Picker */}
          <Input
            label="Payment Date *"
            id="payment_date"
            type="date"
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />

          {/* Pricing Info Cards (Read Only) */}
          <Input
            label="Annual Price (Net)"
            id="annual-price"
            value={selectedPayment ? formatCurrency(selectedPayment.price_after_discount) : ''}
            disabled
            className="bg-surface-muted font-mono"
          />

          <Input
            label="Remaining Balance (Before)"
            id="remain-before"
            value={selectedPayment ? formatCurrency(selectedPayment.remain_balance) : ''}
            disabled
            className="bg-surface-muted font-mono text-danger"
          />

          {/* Price Quantity Input */}
          <Input
            label="Payment Amount (IQD) *"
            id="amount_paid"
            type="number"
            placeholder="Amount paid now"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          {/* Begin Paid computed */}
          <Input
            label="Total Cumulative Paid (After)"
            id="begin-paid"
            value={selectedPayment ? formatCurrency(beginPaid) : ''}
            disabled
            className="bg-surface-muted font-mono text-success"
          />

          {/* Remaining After computed */}
          <Input
            label="Remaining Balance (After)"
            id="remain-after"
            value={selectedPayment ? formatCurrency(remainAfter) : ''}
            disabled
            className="bg-surface-muted font-mono text-danger"
          />

          <div className="sm:col-span-2">
            <Input
              label="Notes"
              id="notes"
              placeholder="e.g. Paid in cash, parent check no., etc."
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>

          <div className="md:col-span-1 justify-self-end w-full">
            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center gap-1.5"
              isLoading={createMutation.isPending}
            >
              <HiOutlinePrinter className="w-4 h-4" />
              <span>Save & Print</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Data Table History (Bottom Section) */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-sm text-text">Installment History</h3>
        </div>
        <DataTable
          columns={columns}
          data={installmentsData?.data || []}
          isLoading={isLoading}
          rowClass={(row) => (row.is_returned ? 'returned' : '')}
        />
        {installmentsData && (
          <TablePagination
            currentPage={page}
            lastPage={installmentsData.meta.last_page}
            onPageChange={setPage}
            total={installmentsData.meta.total}
            perPage={installmentsData.meta.per_page}
          />
        )}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoiceNo={invoiceNo}
        invoiceUrl={invoiceUrl}
      />

      {/* Return Bill Confirm Dialog */}
      <ConfirmDialog
        isOpen={returnId !== null}
        onClose={() => setReturnId(null)}
        onConfirm={handleReturnConfirm}
        title="Void / Return Bill"
        message="Are you sure you want to void this installment payment? Voiding will reverse the paid amount and increase the student's remaining balance."
        isLoading={returnMutation.isPending}
      />
    </div>
  );
}
