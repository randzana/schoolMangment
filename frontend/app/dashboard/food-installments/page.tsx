'use client';
 
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useFoodInstallments, useCreateFoodInstallment, useReturnFoodInstallment } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InvoiceModal } from '@/components/invoice/InvoiceModal';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import { HiOutlinePrinter, HiOutlineTrash, HiOutlineArrowUturnLeft, HiOutlinePlusCircle } from 'react-icons/hi2';
import { useAuthStore } from '@/store/authStore';
 
const foodInstallmentSchema = zod.object({
  student_id: zod.number().min(1, 'تکایە قوتابییەک هەڵبژێرە'),
  amount_paid: zod.number().min(1, 'بڕی پارەی دراو دەبێت لە ٠ زیاتر بێت'),
  payment_date: zod.string().min(1, 'دیاریکردنی بەرواری پارەدان داواکراوە'),
  notes: zod.string().optional(),
});
 
type FoodInstallmentFormValues = zod.infer<typeof foodInstallmentSchema>;
 
export default function FoodInstallmentsPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Invoice state
  const [invoiceNo, setInvoiceNo] = useState<number | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
 
  // Return bill state
  const [returnId, setReturnId] = useState<number | null>(null);
 
  const { data: installmentsData, isLoading } = useFoodInstallments({ page });
  const createMutation = useCreateFoodInstallment();
  const returnMutation = useReturnFoodInstallment();
 
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FoodInstallmentFormValues>({
    resolver: zodResolver(foodInstallmentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      amount_paid: 0,
      notes: '',
    },
  });
 
  const handleStudentSelect = (student: any) => {
    setValue('student_id', student.id);
  };

  const openAddModal = () => {
    reset({
      student_id: 0,
      amount_paid: 0,
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsFormOpen(true);
  };
 
  const onSubmit = (values: FoodInstallmentFormValues) => {
    createMutation.mutate(values, {
      onSuccess: (res) => {
        setIsFormOpen(false);
        const created = res.data;
        setInvoiceNo(created.invoice_no);
        setInvoiceUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/food-installments/${created.id}/invoice`);
        setIsInvoiceOpen(true);
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
    { header: 'ژمارەی پسوولە', accessor: (row) => `#${row.invoice_no}`, sortable: true },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date), sortable: true },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name },
    { header: 'پۆل', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-primary font-bold' },
    {
      header: 'گەڕاوەتەوە',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.is_returned ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
          {row.is_returned ? 'بەڵێ' : 'نەخێر'}
        </span>
      ),
    },
    {
      header: 'کردارەکان',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/food-installments/${row.id}/invoice`, '_blank')}
            title="چاپکردنەوەی پسوولە"
          >
            <HiOutlinePrinter className="w-4 h-4" />
          </Button>
          {!row.is_returned && user?.role === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger-light"
              onClick={() => setReturnId(row.id)}
              title="گێڕانەوەی پسوولە"
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">مانگانەی نانخواردن</h1>
          <p className="text-xs text-text-muted">تۆمارکردن و بەڕێوەبردنی پارەی مانگانەی نانخواردنی قوتابخانە</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start font-semibold">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>تۆمارکردنی پارەدان</span>
        </Button>
      </div>
 
      {/* History Data Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-sm text-text">مێژووی پارەدانەکان</h3>
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
 
      {/* Record Payment Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="تۆمارکردنی پارەی مانگانەی نانخواردن">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AutocompleteInput
            label="قوتابی هەڵبژێرە *"
            onSelect={handleStudentSelect}
            error={errors.student_id?.message}
          />
 
          <Input
            label="بەرواری پارەدان *"
            id="payment_date"
            type="date"
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />
 
          <Input
            label="بڕی پارەی دراو (دینار) *"
            id="amount_paid"
            type="number"
            placeholder="بڕی پارەی دراو لە ئێستادا"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />
 
          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              تێبینی
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="بۆ نموونە: تێبینی لەسەر مانگی پارەدانەکە یان جۆری خواردنەکە"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>
 
          <div className="flex justify-end gap-3 pt-2 font-semibold">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              تۆمارکردن و چاپ
            </Button>
          </div>
        </form>
      </Modal>
 
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
        title="هەڵوەشاندنەوە / گێڕانەوەی پسوولە"
        message="ئایا دڵنیای لە هەڵوەشاندنەوەی ئەم پارەدانەی نانخواردنە؟ هەڵوەشاندنەوە بڕە پارە دراوەکە دەگەڕێنێتەوە و قەرزی قوتابییەکە زیاد دەکاتەوە."
        isLoading={returnMutation.isPending}
      />
    </div>
  );
}
