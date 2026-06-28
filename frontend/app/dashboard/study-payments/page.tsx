'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useStudyPayments, useStudyPaymentsSummary, useSaveStudyPayment } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { AutocompleteInput } from '@/components/forms/AutocompleteInput';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency, GRADE_OPTIONS, GRADE_MAP, getBalanceRowClass } from '@/lib/utils';
import { HiOutlinePencilSquare, HiOutlinePlusCircle, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const setupPaymentSchema = zod.object({
  student_id: zod.number().min(1, 'Select a student'),
  annual_price: zod.number().min(0, 'Annual price must be positive'),
  discount: zod.number().min(0, 'Discount must be positive'),
  notes: zod.string().optional(),
});

type SetupFormValues = zod.infer<typeof setupPaymentSchema>;

export default function StudyPaymentsPage() {
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any | null>(null);

  const { data: paymentsData, isLoading } = useStudyPayments({ search, grade, page });
  const { data: summaryData } = useStudyPaymentsSummary();
  const savePaymentMutation = useSaveStudyPayment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SetupFormValues>({
    resolver: zodResolver(setupPaymentSchema),
  });

  const annualPrice = watch('annual_price') || 0;
  const discount = watch('discount') || 0;
  const priceAfterDiscount = Math.max(0, annualPrice - discount);

  const openAddModal = () => {
    setEditingPayment(null);
    reset({
      student_id: 0,
      annual_price: 0,
      discount: 0,
      notes: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (payment: any) => {
    setEditingPayment(payment);
    reset({
      student_id: payment.student_id,
      annual_price: parseFloat(payment.annual_price) || 0,
      discount: parseFloat(payment.discount) || 0,
      notes: payment.notes || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = (values: SetupFormValues) => {
    savePaymentMutation.mutate(values, {
      onSuccess: () => {
        setIsFormOpen(false);
        reset();
      },
    });
  };

  const columns: Column<any>[] = [
    { header: 'Serial No', accessor: (row) => row.student?.serial_number },
    { header: 'Student Name', accessor: (row) => row.student?.full_name, sortable: true },
    { header: 'Grade', accessor: (row) => GRADE_MAP[row.student?.grade] || row.student?.grade },
    { header: 'Annual Price', accessor: (row) => formatCurrency(row.annual_price) },
    { header: 'Discount', accessor: (row) => formatCurrency(row.discount), className: 'text-danger' },
    { header: 'Net Price', accessor: (row) => formatCurrency(row.price_after_discount), className: 'font-semibold' },
    { header: 'Total Paid', accessor: (row) => formatCurrency(row.total_paid), className: 'text-success font-semibold' },
    { header: 'Remaining', accessor: (row) => formatCurrency(row.remain_balance), className: 'text-danger font-bold' },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openEditModal(row)}
          title="Update Tuition Configuration"
        >
          <HiOutlinePencilSquare className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Study Payments</h1>
          <p className="text-xs text-text-muted">Configure student annual tuition prices and discounts</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start">
          <HiOutlinePlusCircle className="w-4 h-4" />
          <span>Setup Fee</span>
        </Button>
      </div>

      {/* Summary Row */}
      {summaryData?.data && (
        <div className="grid gap-6 sm:grid-cols-4">
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Annual Fees</span>
            <p className="text-base font-bold text-text mt-1">{formatCurrency(summaryData.data.total_annual)}</p>
          </div>
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Discounts</span>
            <p className="text-base font-bold text-danger mt-1">-{formatCurrency(summaryData.data.total_discount)}</p>
          </div>
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Collected</span>
            <p className="text-base font-bold text-success mt-1">{formatCurrency(summaryData.data.total_paid)}</p>
          </div>
          <div className="bg-white border p-5 rounded-xl shadow-card">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Outstanding Balance</span>
            <p className="text-base font-bold text-danger mt-1">{formatCurrency(summaryData.data.total_remaining)}</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-border rounded-xl shadow-card">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by student name or serial..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-white text-text focus:border-primary focus:outline-none transition-all placeholder:text-text-light"
          />
          <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-5 h-5 text-text-light" />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white text-text focus:border-primary focus:outline-none transition-all"
          >
            <option value="">All Grades</option>
            {GRADE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={paymentsData?.data || []}
          isLoading={isLoading}
          rowClass={(row) => getBalanceRowClass(row.remain_balance, row.price_after_discount)}
        />
        {paymentsData && (
          <TablePagination
            currentPage={page}
            lastPage={paymentsData.meta.last_page}
            onPageChange={setPage}
            total={paymentsData.meta.total}
            perPage={paymentsData.meta.per_page}
          />
        )}
      </div>

      {/* Setup Form Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingPayment ? 'Modify Annual Tuition' : 'Setup Annual Tuition'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editingPayment ? (
            <AutocompleteInput
              label="Select Student *"
              onSelect={(student) => setValue('student_id', student.id)}
              error={errors.student_id?.message}
            />
          ) : (
            <div className="bg-surface-muted p-3 border border-border rounded-lg">
              <span className="text-[10px] text-text-muted font-bold uppercase">Student Name</span>
              <p className="text-sm font-bold text-text mt-0.5">{editingPayment.student?.full_name}</p>
            </div>
          )}

          <Input
            label="Annual Price (IQD) *"
            id="annual_price"
            type="number"
            placeholder="e.g. 1500000"
            error={errors.annual_price?.message}
            {...register('annual_price', { valueAsNumber: true })}
          />

          <Input
            label="Discount (IQD)"
            id="discount"
            type="number"
            placeholder="e.g. 100000"
            error={errors.discount?.message}
            {...register('discount', { valueAsNumber: true })}
          />

          <div className="bg-surface-muted p-3 border border-border rounded-lg">
            <span className="text-[10px] text-text-muted font-bold uppercase">Net Price After Discount (Computed)</span>
            <p className="text-sm font-mono font-bold text-primary mt-0.5">{formatCurrency(priceAfterDiscount)}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Comments or installment split agreements"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={savePaymentMutation.isPending}>
              Save Setup
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
