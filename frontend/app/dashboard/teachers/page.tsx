'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/hooks';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, Column } from '@/components/tables/DataTable';
import { TablePagination } from '@/components/tables/TablePagination';
import { formatCurrency } from '@/lib/utils';
import { HiOutlineUserPlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

const teacherSchema = zod.object({
  full_name: zod.string().min(1, 'Full name is required').max(150),
  subject: zod.string().max(100).optional().or(zod.literal('')),
  phone: zod.string().max(30).optional().or(zod.literal('')),
  monthly_salary: zod.number().min(0, 'Monthly salary cannot be negative'),
  address: zod.string().optional(),
  notes: zod.string().optional(),
  is_active: zod.boolean().optional(),
});

type TeacherFormValues = zod.infer<typeof teacherSchema>;

export default function TeachersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: teachersData, isLoading } = useTeachers({ search, page });
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher(editingTeacherId || 0);
  const deleteMutation = useDeleteTeacher();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
  });

  const openAddModal = () => {
    setEditingTeacherId(null);
    reset({
      full_name: '',
      subject: '',
      phone: '',
      monthly_salary: 0,
      address: '',
      notes: '',
      is_active: true,
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (teacher: any) => {
    setEditingTeacherId(teacher.id);
    reset({
      full_name: teacher.full_name,
      subject: teacher.subject || '',
      phone: teacher.phone || '',
      monthly_salary: parseFloat(teacher.monthly_salary) || 0,
      address: teacher.address || '',
      notes: teacher.notes || '',
      is_active: teacher.is_active,
    });
    setIsFormModalOpen(true);
  };

  const onSubmit = (values: TeacherFormValues) => {
    if (editingTeacherId) {
      updateMutation.mutate(values, {
        onSuccess: () => setIsFormModalOpen(false),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => setIsFormModalOpen(false),
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
    { header: 'Full Name', accessor: 'full_name', sortable: true },
    { header: 'Subject', accessor: (row) => row.subject || '-' },
    { header: 'Phone', accessor: (row) => row.phone || '-' },
    { header: 'Monthly Salary', accessor: (row) => formatCurrency(row.monthly_salary), sortable: true },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${row.is_active ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
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
            onClick={() => openEditModal(row)}
            title="Edit Teacher"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger-light"
            onClick={() => setDeleteId(row.id)}
            title="Delete Teacher"
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
          <h1 className="text-2xl font-bold tracking-tight text-text">Teachers</h1>
          <p className="text-xs text-text-muted">Manage teacher accounts, salaries, and details</p>
        </div>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-1.5 self-start">
          <HiOutlineUserPlus className="w-4 h-4" />
          <span>Add Teacher</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-border rounded-xl shadow-card">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search teacher by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-3 py-2 border border-border rounded-lg text-sm bg-white text-text focus:border-primary focus:outline-none transition-all placeholder:text-text-light"
          />
          <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-5 h-5 text-text-light" />
        </div>
      </div>

      {/* Teachers Data Table */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <DataTable
          columns={columns}
          data={teachersData?.data || []}
          isLoading={isLoading}
        />
        {teachersData && (
          <TablePagination
            currentPage={page}
            lastPage={teachersData.meta.last_page}
            onPageChange={setPage}
            total={teachersData.meta.total}
            perPage={teachersData.meta.per_page}
          />
        )}
      </div>

      {/* Add / Edit Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingTeacherId ? 'Edit Teacher' : 'Add Teacher'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name *"
            id="full_name"
            placeholder="Teacher full name"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <Input
            label="Subject / Topic"
            id="subject"
            placeholder="e.g. Mathematics"
            error={errors.subject?.message}
            {...register('subject')}
          />

          <Input
            label="Phone"
            id="phone"
            placeholder="e.g. 0750 111 2222"
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Monthly Salary (IQD) *"
            id="monthly_salary"
            type="number"
            placeholder="Monthly salary in IQD"
            error={errors.monthly_salary?.message}
            {...register('monthly_salary', { valueAsNumber: true })}
          />

          <Input
            label="Address"
            id="address"
            placeholder="Home address"
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-text">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any comments, qualifications, or schedule details"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white text-text border-border focus:border-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light/20 transition-all placeholder:text-text-light"
              {...register('notes')}
            />
          </div>

          {editingTeacherId && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_active"
                className="rounded text-primary border-border focus:ring-primary-light/25 w-4 h-4 cursor-pointer"
                {...register('is_active')}
              />
              <label htmlFor="is_active" className="text-xs font-semibold text-text cursor-pointer select-none">
                Active Employee
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingTeacherId ? 'Save Changes' : 'Create Teacher'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This soft-deletes the record and preserves their historical payroll records."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
