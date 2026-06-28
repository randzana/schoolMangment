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
  student_id: zod.number().min(1, 'Select a student'),
  item_type: zod.enum(['clothes', 'book', 'both'], {
    message: 'Item type is required',
  }),
  price: zod.number().min(0, 'Price must be positive'),
  discount: zod.number().min(0, 'Discount must be positive'),
  amount_paid: zod.number().min(0, 'Amount paid must be positive'),
  payment_date: zod.string().min(1, 'Payment date is required'),
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
    { header: 'Invoice No', accessor: (row) => row.invoice_no ? `#${row.invoice_no}` : '-', sortable: true },
    { header: 'Student Name', accessor: (row) => row.student?.full_name },
    { header: 'Grade', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'Item Purchased', accessor: (row) => ITEM_TYPE_MAP[row.item_type] || row.item_type },
    { header: 'Price (Net)', accessor: (row) => formatCurrency(row.price - row.discount) },
    { header: 'Amount Paid', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-success font-semibold' },
    { header: 'Date', accessor: (row) => formatDate(row.payment_date), sortable: true },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/clothes-books/${row.id}/invoice`, '_blank')}
            title="Re-Print Receipt"
          >
            <HiOutlinePrinter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="Delete Purchase"
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
          <h1 className="text-2xl font-bold tracking-tight text-text">Clothes & Books</h1>
          <p className="text-xs text-text-muted">Record uniform and textbook sales transactions</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>Record Sale</span>
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
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Record Uniform/Book Sale">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AutocompleteInput
            label="Select Student *"
            onSelect={(student) => setValue('student_id', student.id)}
            error={errors.student_id?.message}
          />

          <Select
            label="Item Category *"
            id="item_type"
            options={[
              { value: 'clothes', label: 'School Uniform (Clothes)' },
              { value: 'book', label: 'School Textbooks (Books)' },
              { value: 'both', label: 'Both Uniform & Textbooks' },
            ]}
            error={errors.item_type?.message}
            {...register('item_type')}
          />

          <Input
            label="Retail Price (IQD) *"
            id="price"
            type="number"
            placeholder="Price amount"
            error={errors.price?.message}
            {...register('price', { valueAsNumber: true })}
          />

          <Input
            label="Discount (IQD)"
            id="discount"
            type="number"
            placeholder="Discount amount"
            error={errors.discount?.message}
            {...register('discount', { valueAsNumber: true })}
          />

          <div className="bg-surface-muted p-3 border border-border rounded-lg text-xs font-semibold">
            <span className="text-[10px] text-text-muted font-bold uppercase">Net Amount Due</span>
            <p className="text-sm font-mono font-bold text-primary mt-0.5">{formatCurrency(netDue)}</p>
          </div>

          <Input
            label="Amount Paid Now (IQD) *"
            id="amount_paid"
            type="number"
            placeholder="Amount paid"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          <Input
            label="Payment Date *"
            id="payment_date"
            type="date"
            error={errors.payment_date?.message}
            {...register('payment_date')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. Uniform size 10, English study textbooks"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Record & Print
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        message="Are you sure you want to delete this purchase entry? This will permanently delete the transaction record."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
