'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useSalaries, useTeachers, useCreateSalary, useDeleteSalary } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HiOutlinePlusCircle, HiOutlineTrash } from 'react-icons/hi2';

const salarySchema = zod.object({
  teacher_id: zod.number().min(1, 'Select a teacher'),
  month: zod.string().min(7, 'Select payment month').max(7),
  amount_paid: zod.number().min(0, 'Amount paid cannot be negative'),
  paid_date: zod.string().min(1, 'Payment date is required'),
  notes: zod.string().optional(),
});

type SalaryFormValues = zod.infer<typeof salarySchema>;

export default function SalariesPage() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: salariesData, isLoading } = useSalaries({ page });
  const { data: teachersResponse } = useTeachers({ page: 1, per_page: 100 });
  const createMutation = useCreateSalary();
  const deleteMutation = useDeleteSalary();

  const activeTeachers = (teachersResponse?.data || []).filter((t) => t.is_active);
  const teacherOptions = activeTeachers.map((t) => ({
    value: String(t.id),
    label: `${t.full_name} (${t.subject || 'Staff'})`,
  }));

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SalaryFormValues>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      paid_date: new Date().toISOString().split('T')[0],
      month: new Date().toISOString().slice(0, 7),
    },
  });

  const openAddModal = () => {
    reset({
      teacher_id: 0,
      month: new Date().toISOString().slice(0, 7),
      amount_paid: 0,
      paid_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleTeacherSelect = (teacherIdStr: string) => {
    const tid = parseInt(teacherIdStr, 10);
    setValue('teacher_id', tid);
    // Auto-fill teacher's standard monthly salary
    const teacher = activeTeachers.find((t) => t.id === tid);
    if (teacher) {
      setValue('amount_paid', parseFloat(teacher.monthly_salary) || 0);
    }
  };

  const onSubmit = (values: SalaryFormValues) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsFormOpen(false);
        reset();
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
    { header: 'Teacher Name', accessor: (row) => row.teacher?.full_name },
    { header: 'Subject', accessor: (row) => row.teacher?.subject || 'Staff' },
    { header: 'Payroll Month', accessor: 'month', sortable: true },
    { header: 'Amount Paid', accessor: (row) => formatCurrency(row.amount_paid), className: 'text-success font-semibold', sortable: true },
    { header: 'Paid Date', accessor: (row) => formatDate(row.paid_date), sortable: true },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger-light"
          onClick={() => setDeleteId(row.id)}
          title="Delete Payroll Record"
        >
          <HiOutlineTrash className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Salary Expenses</h1>
          <p className="text-xs text-text-muted">Record and audit teacher monthly payroll expenses</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>Pay Salary</span>
        </Button>
      </div>

      {/* History Data Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={salariesData?.data || []}
          isLoading={isLoading}
        />
        {salariesData && (
          <TablePagination
            currentPage={page}
            lastPage={salariesData.meta.last_page}
            onPageChange={setPage}
            total={salariesData.meta.total}
            perPage={salariesData.meta.per_page}
          />
        )}
      </div>

      {/* Record Salary Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Record Salary Payment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="Select Teacher *"
            id="teacher-select"
            options={teacherOptions}
            placeholder="Choose an active employee"
            error={errors.teacher_id?.message}
            onChange={(e) => handleTeacherSelect(e.target.value)}
          />

          <Input
            label="Payroll Month *"
            id="month"
            type="month"
            error={errors.month?.message}
            {...register('month')}
          />

          <Input
            label="Amount Paid (IQD) *"
            id="amount_paid"
            type="number"
            placeholder="Amount paid in IQD"
            error={errors.amount_paid?.message}
            {...register('amount_paid', { valueAsNumber: true })}
          />

          <Input
            label="Payment Date *"
            id="paid_date"
            type="date"
            error={errors.paid_date?.message}
            {...register('paid_date')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. Paid in cash, includes holiday bonuses, etc."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Record Payroll
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Salary Record"
        message="Are you sure you want to delete this salary payment record? This action will permanently remove the entry."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
