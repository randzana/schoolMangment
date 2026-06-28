'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HiOutlinePlusCircle, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';

const expenseSchema = zod.object({
  title: zod.string().min(1, 'Title is required').max(200),
  amount: zod.number().min(1, 'Amount must be greater than 0'),
  expense_date: zod.string().min(1, 'Date is required'),
  category: zod.string().max(100).optional().or(zod.literal('')),
  description: zod.string().optional(),
  receipt_no: zod.string().max(50).optional().or(zod.literal('')),
});

type ExpenseFormValues = zod.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: expensesData, isLoading } = useExpenses({ page });
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense(editingExpense?.id || 0);
  const deleteMutation = useDeleteExpense();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
  });

  const openAddModal = () => {
    setEditingExpense(null);
    reset({
      title: '',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      receipt_no: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (expense: any) => {
    setEditingExpense(expense);
    reset({
      title: expense.title,
      amount: parseFloat(expense.amount) || 0,
      expense_date: expense.expense_date,
      category: expense.category || '',
      description: expense.description || '',
      receipt_no: expense.receipt_no || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: ExpenseFormValues) => {
    if (editingExpense) {
      updateMutation.mutate(values, {
        onSuccess: () => setIsFormOpen(false),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => setIsFormOpen(false),
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns: Column<any>[] = [
    { header: 'Title', accessor: 'title', sortable: true },
    { header: 'Amount', accessor: (row) => formatCurrency(row.amount), sortable: true, className: 'text-danger font-semibold' },
    { header: 'Category', accessor: (row) => row.category || '-' },
    { header: 'Date', accessor: (row) => formatDate(row.expense_date), sortable: true },
    { header: 'Receipt No', accessor: (row) => row.receipt_no || '-' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit Expense"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="Delete Expense"
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
          <h1 className="text-2xl font-bold tracking-tight text-text">Expenses</h1>
          <p className="text-xs text-text-muted">Record and verify general school administrative and utility expenses</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>Record Expense</span>
        </Button>
      </div>

      {/* Summary Cards */}
      {expensesData?.meta && (
        <div className="grid gap-6 sm:grid-cols-2 max-w-2xl">
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Expenses This Month</span>
            <p className="text-base font-bold text-danger mt-1">{formatCurrency((expensesData.meta as any).total_this_month)}</p>
          </div>
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Expenses This Year</span>
            <p className="text-base font-bold text-danger mt-1">{formatCurrency((expensesData.meta as any).total_this_year)}</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={expensesData?.data || []}
          isLoading={isLoading}
        />
        {expensesData && (
          <TablePagination
            currentPage={page}
            lastPage={expensesData.meta.last_page}
            onPageChange={setPage}
            total={expensesData.meta.total}
            perPage={expensesData.meta.per_page}
          />
        )}
      </div>

      {/* Record/Edit Expense Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingExpense ? 'Modify Expense Record' : 'Record Expense'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Expense Title *"
            id="title"
            placeholder="e.g. Office Stationery Supplies"
            error={errors.title?.message}
            {...register('title')}
          />

          <Input
            label="Expense Amount (IQD) *"
            id="amount"
            type="number"
            placeholder="Amount spent in IQD"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />

          <Input
            label="Expense Date *"
            id="expense_date"
            type="date"
            error={errors.expense_date?.message}
            {...register('expense_date')}
          />

          <Input
            label="Category"
            id="category"
            placeholder="e.g. Utilities, Maintenance, Rent"
            error={errors.category?.message}
            {...register('category')}
          />

          <Input
            label="Receipt Reference Number"
            id="receipt_no"
            placeholder="e.g. RC-849492"
            error={errors.receipt_no?.message}
            {...register('receipt_no')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-semibold text-text">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Detailed description of the expense"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('description')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action soft-deletes the entry."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
