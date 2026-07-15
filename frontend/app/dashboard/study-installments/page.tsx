'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useStudyInstallments, useCreateStudyInstallment, useUpdateStudyInstallment, useDeleteStudyInstallment } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import { HiOutlinePrinter, HiOutlineTrash, HiOutlineArrowUturnLeft, HiOutlinePencil } from 'react-icons/hi2';
import api, { API_URL } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const installmentSchema = zod.object({
  study_payment_id: zod.number().min(1, 'تکایە قوتابییەک هەڵبژێرە کە کرێی خوێندنی بۆ ڕێکخرابێت'),
  amount_paid: zod.number().min(1, 'بڕی پارەی دراو دەبێت لە ٠ زیاتر بێت'),
  payment_date: zod.string().min(1, 'دیاریکردنی بەرواری پارەدان داواکراوە'),
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
  
  // Delete and edit state
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<any | null>(null);

  const { data: installmentsData, isLoading, refetch } = useStudyInstallments({ page });
  const createMutation = useCreateStudyInstallment();
  const deleteMutation = useDeleteStudyInstallment();

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
      alert(`بڕی پارەی دراو زیاترە لەو بڕەی کە ماوە: ${formatCurrency(selectedPayment.remain_balance)} دینار`);
      return;
    }

    createMutation.mutate(values, {
      onSuccess: (res) => {
        const created = res.data;
        setInvoiceNo(created.invoice_no);
        setInvoiceUrl(`${API_URL}/study-installments/${created.id}/invoice`);
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

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
        },
      });
    }
  };

  const columns: Column<any>[] = [
    { header: 'ژمارەی پسوولە', accessor: (row) => `#${row.invoice_no}`, sortable: true },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date), sortable: true },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name },
    { header: 'پۆل', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-primary font-bold' },
    { header: 'قەرز (ماوە) دوای ئەمە', accessor: (row) => formatCurrency(row.remain_after), className: 'text-danger' },
    {
      header: 'کردارەکان',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${API_URL}/study-installments/${row.id}/invoice`, '_blank')}
            title="چاپکردنەوەی پسوولە"
          >
            <HiOutlinePrinter className="w-4 h-4" />
          </Button>
          {!row.is_returned && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary-light"
              onClick={() => setEditingInstallment(row)}
              title="دەستکاریکردنی پسوولە"
            >
              <HiOutlinePencil className="w-4 h-4" />
            </Button>
          )}
          {user?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-light"
              onClick={() => setDeleteId(row.id)}
              title="سڕینەوەی پسوولە"
            >
              <HiOutlineTrash className="w-4 h-4" />
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
        <h1 className="text-2xl font-bold tracking-tight text-text">قستەکانی خوێندن</h1>
        <p className="text-xs text-text-muted">تۆمارکردن و دڵنیابوونەوە لە قستەکانی خوێندنی قوتابییان</p>
      </div>

      {/* Entry Form (Top Section) */}
      <div className="bg-white border border-border p-6 rounded-xl shadow-card space-y-6">
        <h3 className="font-semibold text-sm text-text border-b pb-2">تۆمارکردنی مامەڵەی قستی نوێ</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 items-end">
          {/* Autocomplete Search */}
          <div className="sm:col-span-2">
            <AutocompleteInput
              label="قوتابی هەڵبژێرە *"
              onSelect={handleStudentSelect}
              error={errors.study_payment_id?.message}
            />
          </div>

          {/* Grade Display */}
          <Input
            label="پۆل"
            id="student-grade"
            value={selectedStudent ? GRADE_MAP[selectedStudent.grade] || selectedStudent.grade : ''}
            disabled
            className="bg-surface-muted"
          />

          {/* Date Picker */}
          <Input
            label="بەرواری پارەدان *"
            id="payment_date"
            type="date"
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />

          {/* Pricing Info Cards (Read Only) */}
          <Input
            label="کرێی خوێندنی ساڵانە (کۆی گشتی)"
            id="annual-price"
            value={selectedPayment ? formatCurrency(selectedPayment.price_after_discount) : ''}
            disabled
            className="bg-surface-muted font-mono"
          />

          <Input
            label="قەرزی ماوە (پێشتر)"
            id="remain-before"
            value={selectedPayment ? formatCurrency(selectedPayment.remain_balance) : ''}
            disabled
            className="bg-surface-muted font-mono text-danger"
          />

          {/* Price Quantity Input */}
          <Input
            label="بڕی پارەی دراو (دینار) *"
            id="amount_paid"
            type="number"
            placeholder="بڕی پارەی دراو لە ئێستادا"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          {/* Begin Paid computed */}
          <Input
            label="کۆی دراو (دواتر)"
            id="begin-paid"
            value={selectedPayment ? formatCurrency(beginPaid) : ''}
            disabled
            className="bg-surface-muted font-mono text-success"
          />

          {/* Remaining After computed */}
          <Input
            label="قەرزی ماوە (دواتر)"
            id="remain-after"
            value={selectedPayment ? formatCurrency(remainAfter) : ''}
            disabled
            className="bg-surface-muted font-mono text-danger"
          />

          <div className="sm:col-span-2">
            <Input
              label="تێبینی"
              id="notes"
              placeholder="بۆ نموونە: بە نەختینە درا، ژمارەی چەک، هتد."
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>

          <div className="md:col-span-1 justify-self-end w-full">
            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center justify-center gap-1.5"
              isLoading={createMutation.isPending}
            >
              <HiOutlinePrinter className="w-4 h-4" />
              <span>تۆمارکردن و چاپ</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Data Table History (Bottom Section) */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-sm text-text">مێژووی قستەکان</h3>
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

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="سڕینەوەی پسوولە"
        message="ئایا دڵنیای لە سڕینەوەی ئەم پسوولەیە؟ سڕینەوەی پسوولە بە تەواوی تۆمارەکە لە سیستەمەکە لادەبات و قەرزی قوتابییەکە زیاد دەکاتەوە."
        isLoading={deleteMutation.isPending}
      />

      {/* Edit Installment Modal */}
      {editingInstallment && (
        <EditInstallmentModal
          installment={editingInstallment}
          onClose={() => setEditingInstallment(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

interface EditModalProps {
  installment: any;
  onClose: () => void;
  onSuccess: () => void;
}

function EditInstallmentModal({ installment, onClose, onSuccess }: EditModalProps) {
  const updateMutation = useUpdateStudyInstallment(installment.id);
  const { register, handleSubmit, formState: { errors } } = useForm<{
    amount_paid: number;
    payment_date: string;
    notes: string;
  }>({
    defaultValues: {
      amount_paid: Number(installment.amount_paid),
      payment_date: installment.payment_date ? new Date(installment.payment_date).toISOString().split('T')[0] : '',
      notes: installment.notes || '',
    }
  });

  const onSubmit = (values: any) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="دەستکاریکردنی قیستی خوێندن">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="بڕی پارەی دراو (دینار) *"
          id="edit_amount_paid"
          type="number"
          error={errors.amount_paid?.message}
          {...register('amount_paid', { valueAsNumber: true, required: 'تکایە بڕی پارەکە بنووسە' })}
        />
        <Input
          label="بەرواری پارەدان *"
          id="edit_payment_date"
          type="date"
          error={errors.payment_date?.message}
          {...register('payment_date', { required: 'تکایە بەروارەکە دیاری بکە' })}
        />
        <Input
          label="تێبینی"
          id="edit_notes"
          error={errors.notes?.message}
          {...register('notes')}
        />
        <div className="flex justify-end gap-3 pt-2 font-semibold">
          <Button type="button" variant="secondary" onClick={onClose}>
            پاشگەزبوونەوە
          </Button>
          <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
            پاشەکەوتکردن
          </Button>
        </div>
      </form>
    </Modal>
  );
}
