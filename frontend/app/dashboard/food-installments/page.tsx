'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useFoodInstallments, useCreateFoodInstallment, useReturnFoodInstallment } from '@/hooks';
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

const foodInstallmentSchema = zod.object({
  food_payment_id: zod.number().min(1, 'تکایە قوتابییەک هەڵبژێرە کە پلانی نانخواردنی بۆ ڕێکخرابێت'),
  amount_paid: zod.number().min(1, 'بڕی پارەی دراو دەبێت لە ٠ زیاتر بێت'),
  payment_date: zod.string().min(1, 'دیاریکردنی بەرواری پارەدان داواکراوە'),
  notes: zod.string().optional(),
});

type FoodInstallmentFormValues = zod.infer<typeof foodInstallmentSchema>;

export default function FoodInstallmentsPage() {
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

  const { data: installmentsData, isLoading } = useFoodInstallments({ page });
  const createMutation = useCreateFoodInstallment();
  const returnMutation = useReturnFoodInstallment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FoodInstallmentFormValues>({
    resolver: zodResolver(foodInstallmentSchema),
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
      const res = await api.get(`/food-payments?search=${encodeURIComponent(student.serial_number)}`);
      const payment = res.data.data[0];
      
      if (payment) {
        setSelectedPayment(payment);
        setValue('food_payment_id', payment.id);
      } else {
        setSelectedPayment(null);
        setValue('food_payment_id', 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onSubmit = (values: FoodInstallmentFormValues) => {
    if (selectedPayment && values.amount_paid > parseFloat(selectedPayment.remain_balance)) {
      alert(`بڕی پارەی دراو زیاترە لەو بڕەی کە ماوە: ${formatCurrency(selectedPayment.remain_balance)} دینار`);
      return;
    }

    createMutation.mutate(values, {
      onSuccess: (res) => {
        const created = res.data;
        setInvoiceNo(created.invoice_no);
        setInvoiceUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/food-installments/${created.id}/invoice`);
        setIsInvoiceOpen(true);
        
        // Reset form
        setSelectedStudent(null);
        setSelectedPayment(null);
        reset({
          food_payment_id: 0,
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
    { header: 'ژمارەی پسوولە', accessor: (row) => `#${row.invoice_no}`, sortable: true },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date), sortable: true },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name },
    { header: 'پۆل', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-primary font-bold' },
    { header: 'قەرز (ماوە) دوای ئەمە', accessor: (row) => formatCurrency(row.remain_after), className: 'text-danger' },
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
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">قستەکانی نانخواردن</h1>
        <p className="text-xs text-text-muted">تۆمارکردن و دڵنیابوونەوە لە قست و پارەی نانخواردنی قوتابخانە</p>
      </div>

      {/* Entry Form */}
      <div className="bg-white border border-border p-6 rounded-xl shadow-card space-y-6">
        <h3 className="font-semibold text-sm text-text border-b pb-2">تۆمارکردنی قستی نوێی نانخواردن</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 sm:grid-cols-2 md:grid-cols-4 items-end">
          <div className="sm:col-span-2">
            <AutocompleteInput
              label="قوتابی هەڵبژێرە *"
              onSelect={handleStudentSelect}
              error={errors.food_payment_id?.message}
            />
          </div>

          <Input
            label="پۆل"
            id="student-grade"
            value={selectedStudent ? GRADE_MAP[selectedStudent.grade] || selectedStudent.grade : ''}
            disabled
            className="bg-surface-muted"
          />

          <Input
            label="بەرواری پارەدان *"
            id="payment_date"
            type="date"
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />

          <Input
            label="کرێی مانگانەی نانخواردن (کۆیت گشتی)"
            id="monthly-price"
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

          <Input
            label="بڕی پارەی دراو (دینار) *"
            id="amount_paid"
            type="number"
            placeholder="بڕی پارەی دراو لە ئێستادا"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          <Input
            label="کۆی دراو (دواتر)"
            id="begin-paid"
            value={selectedPayment ? formatCurrency(beginPaid) : ''}
            disabled
            className="bg-surface-muted font-mono text-success"
          />

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
              placeholder="بۆ نموونە: تێبینی لەسەر جۆری خواردن یان هتد."
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>

          <div className="md:col-span-1 justify-self-end w-full">
            <Button
              type="submit"
              variant="primary"
              className="w-full flex items-center gap-1.5 font-semibold"
              isLoading={createMutation.isPending}
            >
              <HiOutlinePrinter className="w-4 h-4" />
              <span>تۆمارکردن و چاپ</span>
            </Button>
          </div>
        </form>
      </div>

      {/* History Data Table */}
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

      {/* Return Bill Confirm Dialog */}
      <ConfirmDialog
        isOpen={returnId !== null}
        onClose={() => setReturnId(null)}
        onConfirm={handleReturnConfirm}
        title="هەڵوەشاندنەوە / گێڕانەوەی پسوولە"
        message="ئایا دڵنیای لە هەڵوەشاندنەوەی ئەم قستی نانخواردنە؟ هەڵوەشاندنەوە بڕە پارە دراوەکە دەگەڕێنێتەوە و قەرزی قوتابییەکە زیاد دەکاتەوە."
        isLoading={returnMutation.isPending}
      />
    </div>
  );
}
