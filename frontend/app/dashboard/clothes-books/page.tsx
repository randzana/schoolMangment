'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useClothesBooks, useCreateClothesBook, useDeleteClothesBook } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP, ITEM_TYPE_MAP } from '@/lib/utils';
import { HiOutlinePrinter, HiOutlineTrash, HiOutlinePlusCircle } from 'react-icons/hi2';

const purchaseSchema = zod.object({
  student_id: zod.number().min(1, 'تکایە قوتابییەک هەڵبژێرە'),
  item_type: zod.enum(['clothes', 'book', 'both'], {
    message: 'دیاریکردنی جۆری بابەت پێویستە',
  }),
  price: zod.number().min(0, 'دەبێت نرخ لە ٠ زیاتر بێت'),
  discount: zod.number().min(0, 'دەبێت داشکاندن لە ٠ زیاتر بێت'),
  amount_paid: zod.number().min(0, 'دەبێت بڕی پارەی دراو لە ٠ زیاتر بێت'),
  payment_date: zod.string().min(1, 'دیاریکردنی بەرواری پارەدان پێویستە'),
  notes: zod.string().optional(),
});

type PurchaseFormValues = zod.infer<typeof purchaseSchema>;

export default function ClothesBooksPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: purchasesData, isLoading } = useClothesBooks({ page });
  const createMutation = useCreateClothesBook();
  const deleteMutation = useDeleteClothesBook();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      discount: 0,
    },
  });

  const price = watch('price') || 0;
  const discount = watch('discount') || 0;
  const netDue = Math.max(0, price - discount);

  const openAddModal = () => {
    reset({
      student_id: 0,
      item_type: 'book',
      price: 0,
      discount: 0,
      amount_paid: 0,
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: PurchaseFormValues) => {
    createMutation.mutate(values, {
      onSuccess: (res) => {
        setIsFormOpen(false);
        // Print the invoice directly
        const created = res.data;
        window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/clothes-books/${created.id}/invoice`, '_blank');
      },
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: Column<any>[] = [
    { header: 'ژمارەی پسوولە', accessor: (row) => row.invoice_no ? `#${row.invoice_no}` : '-', sortable: true },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name },
    { header: 'پۆل', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'بابەتی فرۆشراو', accessor: (row) => ITEM_TYPE_MAP[row.item_type] || row.item_type },
    { header: 'نرخ (سافی)', accessor: (row) => formatCurrency(row.price - row.discount) },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-success font-semibold' },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date), sortable: true },
    {
      header: 'کردارەکان',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/clothes-books/${row.id}/invoice`, '_blank')}
            title="چاپکردنەوەی پسوولە"
          >
            <HiOutlinePrinter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="سڕینەوەی کڕین"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">جلوبەرگ و کتێب</h1>
          <p className="text-xs text-text-muted">تۆمارکردنی مامەڵەکانی فرۆشتنی جلی قوتابخانە و کتێب</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start font-semibold">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>تۆمارکردنی فرۆشتن</span>
        </Button>
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={purchasesData?.data || []}
          isLoading={isLoading}
        />
        {purchasesData && (
          <TablePagination
            currentPage={page}
            lastPage={purchasesData.meta.last_page}
            onPageChange={setPage}
            total={purchasesData.meta.total}
            perPage={purchasesData.meta.per_page}
          />
        )}
      </div>

      {/* Record Purchase Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="تۆمارکردنی فرۆشتنی جلوبەرگ/کتێب">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AutocompleteInput
            label="قوتابی هەڵبژێرە *"
            onSelect={(student) => setValue('student_id', student.id)}
            error={errors.student_id?.message}
          />

          <Select
            label="جۆری بابەت *"
            id="item_type"
            options={[
              { value: 'clothes', label: 'جلی قوتابخانە (جلوبەرگ)' },
              { value: 'book', label: 'کتێبی خوێندن (کتێبەکان)' },
              { value: 'both', label: 'هەردووکیان (جلی قوتابخانە و کتێب)' },
            ]}
            error={errors.item_type?.message}
            {...register('item_type')}
          />

          <Input
            label="نرخی فرۆشتن (دینار) *"
            id="price"
            type="number"
            placeholder="بڕی نرخ"
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true })}
          />

          <Input
            label="داشکاندن (دینار)"
            id="discount"
            type="number"
            placeholder="بڕی داشکاندن"
            error={errors.discount?.message}
            {...register('discount', { valueAsNumber: true })}
          />

          <div className="bg-surface-muted p-3 border border-border rounded-lg text-xs font-semibold">
            <span className="text-[10px] text-text-muted font-bold uppercase">کۆی گشتی ماوە (دینار)</span>
            <p className="text-sm font-mono font-bold text-primary mt-0.5">{formatCurrency(netDue)}</p>
          </div>

          <Input
            label="بڕی پارەی دراو لە ئێستادا (دینار) *"
            id="amount_paid"
            type="number"
            placeholder="بڕی پارەی دراو"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          <Input
            label="بەرواری پارەدان *"
            id="payment_date"
            type="date"
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              تێبینی
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="بۆ نموونە: قەبارەی جل ١٠، کتێبی ئینگلیزی، هتد."
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

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="سڕینەوەی تۆمار"
        message="ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟ ئەم کردارە بە هەمیشەیی تۆماری کڕینەکە دەسڕێتەوە."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
