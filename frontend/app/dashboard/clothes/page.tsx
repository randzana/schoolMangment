'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery } from '@tanstack/react-query';
import api, { API_URL } from '@/lib/api';
import { InventoryItem, ClothesBookPayment } from '@/types';
import { useClothesBooks, useCreateClothesBook, useDeleteClothesBook, useUpdateClothesBook } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate, GRADE_MAP } from '@/lib/utils';
import { HiOutlinePrinter, HiOutlineTrash, HiOutlinePlusCircle, HiOutlinePencil } from 'react-icons/hi2';

const purchaseSchema = zod.object({
  student_id: zod.number().min(1, 'تکایە قوتابییەک هەڵبژێرە'),
  amount_paid: zod.number().min(1, 'دەبێت بڕی پارە لە ٠ زیاتر بێت'),
  uniform_size: zod.string().min(1, 'تکایە سایزی جلوبەرگ دیاری بکە'),
  notes: zod.string().optional(),
});

type PurchaseFormValues = zod.infer<typeof purchaseSchema>;

export default function ClothesPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);

  const { data: purchasesData, isLoading, refetch } = useClothesBooks({ page, item_type: 'clothes' });
  const createMutation = useCreateClothesBook();
  const deleteMutation = useDeleteClothesBook();

  // Fetch clothes inventory
  const { data: inventory } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-list-clothes'],
    queryFn: async () => {
      const res = await api.get('/inventory?item_type=clothes');
      return res.data.data;
    },
  });

  const sizeOptions = React.useMemo(() => {
    if (!inventory) return [];
    return inventory.map((item) => {
      const sizeName = item.name.replace('Uniform Size ', '');
      return {
        value: sizeName,
        label: `${sizeName} (مەوجود: ${item.quantity} دانە)`,
      };
    });
  }, [inventory]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      amount_paid: 0,
      uniform_size: '',
      notes: '',
    },
  });

  const openAddModal = () => {
    reset({
      student_id: 0,
      amount_paid: 0,
      uniform_size: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: PurchaseFormValues) => {
    const payload = {
      student_id: values.student_id,
      item_type: 'clothes' as const,
      price: values.amount_paid,
      discount: 0,
      amount_paid: values.amount_paid,
      payment_date: new Date().toISOString().split('T')[0],
      uniform_size: values.uniform_size,
      notes: values.notes || '',
    };

    createMutation.mutate(payload, {
      onSuccess: (res) => {
        setIsFormOpen(false);
        refetch();
        const created = res.data;
        window.open(`${API_URL}/clothes-books/${created.id}/invoice`, '_blank');
      },
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
          refetch();
        },
      });
    }
  };

  const columns: Column<ClothesBookPayment>[] = [
    { header: 'ژمارەی پسوولە', accessor: (row) => row.invoice_no ? `#${row.invoice_no}` : '-', sortable: true },
    { header: 'ناوی قوتابی', accessor: (row) => row.student?.full_name || '-' },
    { header: 'پۆل', accessor: (row) => row.student?.grade ? GRADE_MAP[row.student.grade] || row.student.grade : '-' },
    { header: 'سایزی جل', accessor: (row) => row.uniform_size || '-' },
    { header: 'بڕی دراو', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-success font-semibold' },
    { header: 'بەروار', accessor: (row) => formatDate(row.payment_date), sortable: true },
    {
      header: 'کردارەکان',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${API_URL}/clothes-books/${row.id}/invoice`, '_blank')}
            title="چاپکردنەوەی پسوولە"
          >
            <HiOutlinePrinter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary-light"
            onClick={() => setEditingPurchase(row)}
            title="دەستکاریکردنی تۆمار"
          >
            <HiOutlinePencil className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold tracking-tight text-text">جلوبەرگ</h1>
          <p className="text-xs text-text-muted">تۆمارکردنی مامەڵەکانی فرۆشتنی جلی قوتابخانە</p>
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
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="تۆمارکردنی فرۆشتنی جلوبەرگ">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AutocompleteInput
            label="قوتابی هەڵبژێرە *"
            onSelect={(student) => setValue('student_id', student.id)}
            error={errors.student_id?.message}
          />

          <Select
            label="سایزی جلوبەرگ *"
            placeholder="سایزی جلوبەرگ هەڵبژێرە"
            options={sizeOptions}
            error={errors.uniform_size?.message}
            {...register('uniform_size')}
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
              placeholder="بۆ نموونە: تێبینییەکان لەم بەشە بنووسە"
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
        message="ئایا دڵنیایت لە سڕینەوەی ئەم تۆمارە؟ ئەم کردارە بە هەمیشەیی تۆماری کڕینەکە دەسڕێتەوە و ڕێژەی جلوبەرگ لە کۆگادا زیاد دەکاتەوە."
        isLoading={deleteMutation.isPending}
      />

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <EditClothesModal
          purchase={editingPurchase}
          sizeOptions={sizeOptions}
          onClose={() => setEditingPurchase(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}

function EditClothesModal({ purchase, sizeOptions, onClose, onSuccess }: { purchase: any; sizeOptions: any[]; onClose: () => void; onSuccess: () => void }) {
  const updateMutation = useUpdateClothesBook(purchase.id);
  const { register, handleSubmit, formState: { errors } } = useForm<{
    amount_paid: number;
    uniform_size: string;
    payment_date: string;
    notes: string;
  }>({
    defaultValues: {
      amount_paid: Number(purchase.amount_paid),
      uniform_size: purchase.uniform_size || '',
      payment_date: purchase.payment_date ? new Date(purchase.payment_date).toISOString().split('T')[0] : '',
      notes: purchase.notes || '',
    }
  });

  const onSubmit = (values: any) => {
    const payload = {
      amount_paid: values.amount_paid,
      price: values.amount_paid, // Sync price and amount_paid
      uniform_size: values.uniform_size,
      payment_date: values.payment_date,
      notes: values.notes || '',
    };

    updateMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="دەستکاریکردنی کڕینی جلوبەرگ">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="سایزی جلوبەرگ *"
          placeholder="سایزی جلوبەرگ هەڵبژێرە"
          options={sizeOptions}
          error={errors.uniform_size?.message}
          {...register('uniform_size', { required: 'تکایە سایزێک دیاری بکە' })}
        />
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit_notes" className="text-xs font-semibold text-text">
            تێبینی
          </label>
          <textarea
            id="edit_notes"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
            {...register('notes')}
          />
        </div>
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
